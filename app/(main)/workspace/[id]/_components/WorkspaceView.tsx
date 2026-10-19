"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
    [key: string]: any;
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
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center border-b border-white/6 bg-background px-4">
        {/* Logo and name */}
        <div className="flex flex-1 items-center gap-3">
          <Link
            href="/dashboard"
            className="flex size-8 items-center justify-center rounded-md transition-opacity hover:opacity-80"
          >
            <Image
              src="/brand/mascot-dark.png"
              alt="Back to dashboard"
              width={24}
              height={24}
              className="size-6"
            />
          </Link>
          <EditableWorkspaceName workspaceId={workspaceId} initialName={initialName} />
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/3 p-1">
          <Button
            variant={view === "doc" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("doc")}
          >
            Document
          </Button>
          <Button
            variant={view === "both" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("both")}
          >
            Both
          </Button>
          <Button
            variant={view === "canvas" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("canvas")}
          >
            Canvas
          </Button>
        </div>

        {/* Right actions */}
        <div className="flex flex-1 items-center justify-end gap-2">
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
            variant={isAgentOpen ? "secondary" : "ghost"}
            className="gap-1.5 border border-white/10"
            onClick={() => setIsAgentOpen((v) => !v)}
          >
            <Image src="/brand/mascot.png" alt="" width={16} height={16} className="size-4" />
            <span>{isAgentOpen ? "Close Agent" : "Ask Agent"}</span>
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
