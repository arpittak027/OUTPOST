import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { auth } from "@clerk/nextjs/server";
import { agentToolDefs } from "@/lib/agent-tools";
import { PROMPT_LIMIT_ERROR } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { getPromptUsage, recordPrompt } from "@/lib/billing";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are Outpost's workspace agent. A workspace has two surfaces: a canvas (an infinite whiteboard for diagrams) and a doc (a rich-text document). You change them only by calling tools, never by describing changes in text. Never use em dashes in your replies.

Choosing where to work:
- If the user names a surface ("in the doc", "just the diagram", "only the canvas"), change only that surface.
- Otherwise decide from the request: flows, architectures, ERDs and anything visual go on the canvas; specs, notes, explanations and plans go in the doc. Use both when the request needs both (e.g. "design the schema and document it"), keeping them consistent.
- To turn one surface into the other ("write up this diagram as a spec", "draw what the doc describes"), read its current state below.
- If a surface you need is marked as not open, tell the user to switch to the Both view instead of calling its tools.
- After making changes, reply with one short sentence on what you did.

Doc rules:
- Write content as Markdown in the doc tools: headings, lists, checklists, tables, code blocks, bold, links.
- Prefer targeted edits: insertDocContent to add, updateDocBlock to rewrite one block, deleteDocBlocks to remove. Use replaceDoc only for a full rewrite or when the doc is empty.
- Reference only block ids listed in the current doc state.

Canvas rules:
- One tool call per shape. Every new shape needs a unique caller-assigned "id" (e.g. "rect-1") so later calls in the same turn can reference it (e.g. an arrow's fromShapeId/toShapeId).
- For entity-relationship diagrams, use the ERD tools (createEntityTable, addColumn, updateColumn, removeColumn, connectRelationship), not rectangles.
- Reference only shape ids listed in the current canvas state or created earlier in this turn. Never invent an id.

Canvas layout rules: diagrams must never look cluttered or have overlapping shapes. The canvas is infinite, so spread out as far as needed instead of packing shapes near (0,0).
- Size each box to its label (a short label like "Start" might be 140x80; a label needing 2-3 lines might be 260x140), and compute spacing from actual sizes.
- Vertical gap between stacked boxes: at least 100px of empty space (next y >= previous y + previous height + 100).
- Horizontal gap between side-by-side boxes (e.g. Yes/No branches): at least 120px of empty space (next x >= previous x + previous width + 120).
- Plan positions box by box, adding up real sizes as you go, before creating shapes.
- A title (createText) goes centered above the whole diagram, at least 100px above the topmost box.
- Give each ERD table its own column with at least 150px of horizontal clearance, since tables grow with their column count.`;

const NOT_OPEN = "(not open in this view, so its tools will fail)";

function sanitizeMessages(messages: UIMessage[]): UIMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) return [];

  const result: UIMessage[] = [];
  for (const m of messages) {
    if (!m || !m.role) continue;

    // Skip empty assistant messages
    if (m.role === "assistant") {
      const hasText = m.parts?.some((p) => p.type === "text" && (p as any).text?.trim());
      const hasTools = m.parts?.some(
        (p) => p.type.startsWith("tool-") || p.type === "dynamic-tool"
      );
      if (!hasText && !hasTools) continue;
    }

    const prev = result[result.length - 1];
    // If consecutive user messages, merge their text into the previous message
    if (prev && prev.role === "user" && m.role === "user") {
      const prevText = prev.parts
        .filter((p) => p.type === "text")
        .map((p: any) => p.text)
        .join("\n");
      const currentText = m.parts
        .filter((p) => p.type === "text")
        .map((p: any) => p.text)
        .join("\n");
      prev.parts = [{ type: "text", text: `${prevText}\n${currentText}` }];
      continue;
    }

    result.push(m);
  }
  return result;
}

export async function POST(req: Request) {
  // Fast JWT session verification (0ms network latency)
  const { userId, orgId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const {
    messages,
    workspaceId,
    canvasContext,
    docContext,
  }: {
    messages: UIMessage[];
    workspaceId: string;
    canvasContext: string | null;
    docContext: string | null;
  } = await req.json();

  // Single fast indexed DB query for workspace permissions & ownership
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      clerkOrgId: true,
      creator: { select: { clerkId: true } },
    },
  });
  if (!workspace) return new Response("Workspace not found", { status: 404 });

  const isOwner = workspace.creator.clerkId === userId;
  const isOrgMember = workspace.clerkOrgId && workspace.clerkOrgId === orgId;
  if (!isOwner && !isOrgMember) {
    return new Response("Workspace not found", { status: 404 });
  }

  const ownerId = workspace.clerkOrgId ?? workspace.creator.clerkId;

  // Prompt quota limit check
  if (messages.at(-1)?.role === "user") {
    try {
      const { used, limit } = await getPromptUsage(ownerId);
      if (used >= limit) {
        return Response.json({ error: PROMPT_LIMIT_ERROR, used, limit }, { status: 402 });
      }
    } catch {
      // Graceful pass-through if billing check is unavailable
    }
  }

  const sanitized = sanitizeMessages(messages);
  const modelMessages = await convertToModelMessages(sanitized);

  // Fast Gemini 3.5 Flash Lite model for instant sub-2-second responses without serverless timeout
  const result = streamText({
    model: google("gemini-3.5-flash-lite"),
    system: `${SYSTEM_PROMPT}\n\nCurrent canvas state:\n${canvasContext ?? NOT_OPEN}\n\nCurrent doc state:\n${docContext ?? NOT_OPEN}`,
    tools: agentToolDefs,
    messages: modelMessages,
    maxRetries: 1,
    onFinish: async () => {
      try {
        if (ownerId) await recordPrompt(ownerId, userId, workspaceId);
      } catch {
        // Record prompt non-blocking
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
