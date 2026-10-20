"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import type { Block } from "@blocknote/core";
import type { TLEditorSnapshot } from "tldraw";
import { Button } from "@/components/ui/button";
import { EditableWorkspaceName } from "./EditableWorkspaceName";
import { DocEditor } from "@/components/DocEditorLoader";
import { CanvasEditor } from "./CanvasEditor";
import { AgentChatPanel } from "./AgentChatPanel";
import { ShareDialog } from "./ShareDialog";
import { PlanButton } from "@/components/PlanButton";
import { WorkspaceEditorsProvider, useWorkspaceEditors } from "@/components/WorkspaceEditorsContext";
import { useWorkspaceAgentChat } from "@/hooks/use-workspace-agent-chat";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export type ViewMode = "doc" | "canvas" | "both";

interface WorkspaceViewProps {
  workspaceId: string;
  initialName: string;
  shareToken: string | null;
  entitlements: {
    publicSharing: boolean;
    pdfExport: boolean;
    [key: string]: unknown;
  };
  initialView: ViewMode;
  initialPrompt?: string;
  initialDocContent: Block[] | null;
  initialDocState: string | null;
  initialCanvasSnapshot: TLEditorSnapshot | null;
}

function WorkspaceViewInner({
  workspaceId,
  initialName,
  shareToken,
  entitlements,
  initialView,
  initialPrompt,
  initialDocContent,
  initialDocState,
  initialCanvasSnapshot,
}: WorkspaceViewProps) {
  const { user } = useUser();
  const [view, setView] = useState<ViewMode>(initialView);
  const [isAgentOpen, setIsAgentOpen] = useState(true);

  const { canvasEditor, docEditor } = useWorkspaceEditors();
  const chat = useWorkspaceAgentChat(workspaceId, { canvasEditor, docEditor });
  const router = useRouter();
  const pathname = usePathname();
  const promptSent = useRef(false);

  // Send initial prompt when both editors are ready
  useEffect(() => {
    if (!initialPrompt || promptSent.current || !canvasEditor || !docEditor) return;
    promptSent.current = true;
    chat.sendMessage({ text: initialPrompt });
    router.replace(pathname, { scroll: false });
  }, [initialPrompt, canvasEditor, docEditor, chat, router, pathname]);

  const showDoc = view === "doc" || view === "both";
  const showCanvas = view === "canvas" || view === "both";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {/* Header matching reference video style */}
      <header className="flex h-13 shrink-0 items-center justify-between border-b border-white/6 bg-[#0f1014] px-4 backdrop-blur-md">
        {/* Logo and breadcrumb */}
        <div className="flex flex-1 items-center gap-2.5 min-w-0">
          <Link
            href="/dashboard"
            className="flex size-7 shrink-0 items-center justify-center rounded-lg transition-transform hover:scale-105 hover:opacity-90"
            title="Back to dashboard"
          >
            <Image
              src="/brand/mascot-dark.png"
              alt="Back to dashboard"
              width={22}
              height={22}
              className="size-5.5"
            />
          </Link>
          <div className="flex items-center gap-1.5 min-w-0 text-sm font-medium">
            <Link
              href="/dashboard"
              className="text-zinc-400 hover:text-zinc-200 transition-colors font-medium truncate max-w-[120px] hidden md:inline"
              title="Dashboard"
            >
              Dashboard
            </Link>
            <span className="text-zinc-600 text-xs hidden md:inline">/</span>
            <div className="truncate font-medium text-zinc-100">
              <EditableWorkspaceName workspaceId={workspaceId} initialName={initialName} />
            </div>
          </div>
        </div>

        {/* View switcher pills matching reference video */}
        <div className="flex items-center gap-0.5 rounded-xl border border-white/8 bg-[#14151b] p-0.5 shadow-inner">
          <button
            type="button"
            onClick={() => setView("doc")}
            className={`h-7 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              view === "doc"
                ? "bg-[#23252f] text-white shadow-sm border border-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/4"
            }`}
          >
            Doc
          </button>
          <button
            type="button"
            onClick={() => setView("both")}
            className={`h-7 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              view === "both"
                ? "bg-[#23252f] text-white shadow-sm border border-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/4"
            }`}
          >
            Both
          </button>
          <button
            type="button"
            onClick={() => setView("canvas")}
            className={`h-7 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              view === "canvas"
                ? "bg-[#23252f] text-white shadow-sm border border-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/4"
            }`}
          >
            Canvas
          </button>
        </div>

        {/* Right actions */}
        <div className="flex flex-1 items-center justify-end gap-2.5">
          {/* Active collaborator status */}
          <div className="hidden sm:flex items-center -space-x-1.5 mr-1">
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.fullName ?? "You"}
                title={user.fullName ?? "You"}
                width={24}
                height={24}
                className="size-6 rounded-full ring-2 ring-[#0f1014] object-cover"
              />
            ) : (
              <span
                className="flex size-6 items-center justify-center rounded-full bg-amber-500 ring-2 ring-[#0f1014] text-[10px] font-bold text-black shadow-sm"
                title={user?.fullName ?? "You"}
              >
                {(user?.firstName?.[0] || user?.username?.[0] || "Y").toUpperCase()}
              </span>
            )}
            <span
              className="flex size-6 items-center justify-center rounded-full bg-[#1b1c24] ring-2 ring-[#0f1014] text-[10px] font-bold text-amber-400 shadow-sm border border-amber-500/20"
              title="AI Agent active"
            >
              ✦
            </span>
          </div>

          <PlanButton upgradeOnlyWhenOut />
          
          <ShareDialog
            workspaceId={workspaceId}
            workspaceName={initialName}
            initialShareToken={shareToken}
            canShare={entitlements.publicSharing}
            canExportPdf={entitlements.pdfExport}
          />

          <Button
            size="sm"
            variant="outline"
            className={`h-8 gap-1.5 text-xs font-medium rounded-lg border transition-all ${
              isAgentOpen
                ? "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15"
                : "border-white/10 bg-[#16171d] text-zinc-300 hover:bg-white/5 hover:text-white"
            }`}
            onClick={() => setIsAgentOpen((v) => !v)}
          >
            <Image src="/brand/mascot-dark.png" alt="" width={15} height={15} className="size-3.5" />
            <span>{isAgentOpen ? "Close Agent" : "Ask Agent"}</span>
            {isAgentOpen && (
              <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </Button>
        </div>
      </header>

      {/* Main Resizable Workspace Area */}
      <ResizablePanelGroup
        key={`${view}-${isAgentOpen}`}
        orientation="horizontal"
        className="flex-1"
      >
        {/* Left: Document Editor */}
        {showDoc && (
          <ResizablePanel
            defaultSize={isAgentOpen ? (showCanvas ? "28%" : "72%") : showCanvas ? "35%" : "100%"}
            minSize="15%"
          >
            <DocEditor
              key={workspaceId}
              workspaceId={workspaceId}
              initialContent={initialDocContent}
              initialState={initialDocState}
            />
          </ResizablePanel>
        )}

        {/* Handle between Doc and Canvas */}
        {showDoc && showCanvas && <ResizableHandle withHandle />}

        {/* Center: Whiteboard Canvas */}
        {showCanvas && (
          <ResizablePanel
            defaultSize={isAgentOpen ? (showDoc ? "47%" : "72%") : showDoc ? "65%" : "100%"}
            minSize="20%"
          >
            <CanvasEditor
              workspaceId={workspaceId}
              initialSnapshot={initialCanvasSnapshot}
            />
          </ResizablePanel>
        )}

        {/* Handle between Canvas/Doc and Agent */}
        {isAgentOpen && (showDoc || showCanvas) && <ResizableHandle withHandle />}

        {/* Right: Ask Agent Panel */}
        {isAgentOpen && (
          <ResizablePanel
            defaultSize={view === "both" ? "25%" : "28%"}
            minSize="18%"
            maxSize="45%"
          >
            <AgentChatPanel
              chat={chat}
              isReady={!!canvasEditor || !!docEditor}
              onClose={() => setIsAgentOpen(false)}
            />
          </ResizablePanel>
        )}
      </ResizablePanelGroup>
    </div>
  );
}

export function WorkspaceView(props: WorkspaceViewProps) {
  return (
    <WorkspaceEditorsProvider>
      <WorkspaceViewInner {...props} />
    </WorkspaceEditorsProvider>
  );
}
