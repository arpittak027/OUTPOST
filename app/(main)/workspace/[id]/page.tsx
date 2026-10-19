import { notFound } from "next/navigation";
import type { Block } from "@blocknote/core";
import type { TLEditorSnapshot } from "tldraw";
import { prisma } from "@/lib/prisma";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { getEntitlements, workspaceOwnerId, workspaceOwnerSelect } from "@/lib/billing";
import { WorkspaceView, type ViewMode } from "./_components/WorkspaceView";

function parseViewMode(value: string | string[] | undefined): ViewMode {
  return value === "doc" || value === "canvas" ? value : "both";
}

export default async function WorkspacePage({
  params,
  searchParams,
}: PageProps<"/workspace/[id]">) {
  const { id } = await params;
  const { view: viewParam, prompt } = await searchParams;
  const view = parseViewMode(viewParam);

  // 404 rather than 403 so outsiders can't tell whether a workspace id exists.
  if (!(await canAccessWorkspace(id))) notFound();

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: {
      name: true,
      shareToken: true,
      ...workspaceOwnerSelect,
      doc: { select: { content: true, yjsState: true } },
      canvas: { select: { content: true } },
    },
  });
  if (!workspace) notFound();
  const entitlements = await getEntitlements(workspaceOwnerId(workspace));

  return (
    <WorkspaceView
      workspaceId={id}
      initialName={workspace.name}
      shareToken={workspace.shareToken}
      entitlements={entitlements}
      initialView={view}
      initialPrompt={typeof prompt === "string" ? prompt : undefined}
      initialDocContent={workspace.doc?.content as Block[] | null}
      initialDocState={
        workspace.doc?.yjsState ? Buffer.from(workspace.doc.yjsState).toString("base64") : null
      }
      initialCanvasSnapshot={workspace.canvas?.content as TLEditorSnapshot | null}
    />
  );
}
