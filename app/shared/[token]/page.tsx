import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Block } from "@blocknote/core";
import type { TLEditorSnapshot } from "tldraw";
import { prisma } from "@/lib/prisma";
import { getEntitlements, workspaceOwnerId, workspaceOwnerSelect } from "@/lib/billing";
import { Badge } from "@/components/ui/badge";
import { DocViewer } from "@/components/DocEditorLoader";
import { CanvasViewer } from "./_components/CanvasViewer";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

// Shared links are private-by-obscurity, so keep them out of search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Public, no sign-in: anyone with the token sees a read-only copy of the doc and canvas.
export default async function SharedPage({ params }: PageProps<"/shared/[token]">) {
  const { token } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { shareToken: token },
    select: {
      name: true,
      ...workspaceOwnerSelect,
      doc: { select: { content: true } },
      canvas: { select: { content: true } },
    },
  });
  if (!workspace) notFound();
  // Links stop working if the owner's plan no longer includes sharing (e.g. after cancelling).
  if (!(await getEntitlements(workspaceOwnerId(workspace))).publicSharing) notFound();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex h-13 shrink-0 items-center justify-between border-b border-white/6 bg-[#0f1014] px-4 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex size-7 shrink-0 items-center justify-center rounded-lg transition-transform hover:scale-105" title="Outpost">
            <Image src="/brand/mascot-dark.png" alt="Outpost" width={22} height={22} className="size-5.5" />
          </Link>
          <span className="text-sm font-semibold text-zinc-100 truncate">{workspace.name}</span>
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] font-medium text-amber-300">
            View only
          </Badge>
        </div>
        <Link
          href="/sign-up"
          className="h-8 px-3.5 bg-[#f59e0b] hover:bg-[#ea580c] text-black font-semibold text-xs rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center cursor-pointer"
        >
          Build with Outpost
        </Link>
      </header>

      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize="40%" minSize="20%">
          <div className="h-full overflow-y-auto px-2 py-6 bg-[#0c0d12] custom-scrollbar">
            <DocViewer content={workspace.doc?.content as Block[] | null} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="60%" minSize="20%">
          <CanvasViewer snapshot={workspace.canvas?.content as TLEditorSnapshot | null} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
