"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUp, Sparkles, Square, Wand2, X } from "lucide-react";
import { isToolUIPart, isDynamicToolUIPart } from "ai";
import type { WorkspaceAgentChat } from "@/hooks/use-workspace-agent-chat";
import { Button } from "@/components/ui/button";
import { MicButton } from "@/components/MicButton";
import { useUpgradeDialog } from "@/components/UpgradeDialog";
import { PROMPT_LIMIT_ERROR, UPGRADE_REASONS } from "@/lib/plan-limits";
import { submitOnEnter } from "@/lib/utils";

function formatToolSummary(toolName: string, args: any): string {
  if (!args) return toolName;
  if (toolName === "createRectangle") {
    const label = args.label?.split("\n")[0] || args.id || "";
    return `createRectangle ${label}`.trim();
  }
  if (toolName === "createArrow") {
    return `createArrow ${args.fromShapeId || ""} → ${args.toShapeId || ""}`.trim();
  }
  if (toolName === "createEntityTable") {
    return `createEntityTable ${args.tableName || args.id || ""}`.trim();
  }
  if (toolName === "updateShape") {
    const label = args.label?.split("\n")[0] || args.id || "";
    return `updateShape ${label}`.trim();
  }
  if (toolName === "insertDocContent") {
    return `insertDocContent`;
  }
  if (toolName === "updateDocBlock") {
    return `updateDocBlock ${args.blockId || ""}`.trim();
  }
  if (toolName === "replaceDoc") {
    return `replaceDoc`;
  }
  return toolName;
}

export function AgentChatPanel({
  chat,
  isReady,
  onClose,
}: {
  chat: WorkspaceAgentChat;
  isReady: boolean;
  onClose?: () => void;
}) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, stop, status, error } = chat;
  const openUpgrade = useUpgradeDialog();

  const isBusy = status === "submitted" || status === "streaming";

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !isReady || isBusy) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const lastPart = lastUserMsg?.parts?.find((p) => p.type === "text") as { text: string } | undefined;
    if (lastPart?.text) {
      sendMessage({ text: lastPart.text });
    }
  };

  return (
    <div className="flex h-full w-full flex-col border-l border-white/6 bg-[#0f1015]">
      {/* Sidebar Header matching reference video */}
      <div className="flex h-13 shrink-0 items-center justify-between border-b border-white/6 px-4">
        <div className="flex items-center gap-2">
          <Image src="/brand/mascot-dark.png" alt="" width={18} height={18} className="size-4.5" />
          <span className="text-sm font-semibold text-zinc-100">Agent</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge from video: ● working (amber) or ● ready (emerald) */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {isBusy ? (
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                working
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="size-1.5 rounded-full bg-emerald-500/80" />
                ready
              </span>
            )}
          </div>

          {onClose && (
            <button
              type="button"
              className="size-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              onClick={onClose}
              title="Collapse agent panel"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-5 text-center">
            <Sparkles className="size-6 text-amber-400 mx-auto mb-2 opacity-80" />
            <p className="text-xs leading-relaxed text-zinc-400">
              Ask the agent to draw a diagram, write or edit the doc, or both. Say
              &ldquo;in the doc&rdquo; or &ldquo;on the canvas&rdquo; to target one side.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            if (message.role === "user") {
              const textContent = message.parts
                ?.filter((p) => p.type === "text")
                .map((p: any) => p.text)
                .join("\n") || "";

              return (
                <div key={message.id} className="space-y-1.5 animate-fade-in-up">
                  <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase px-1">
                    YOU
                  </span>
                  <div className="rounded-xl border border-white/8 bg-[#181922] px-4 py-3 text-sm leading-relaxed text-zinc-100 shadow-sm">
                    {textContent}
                  </div>
                </div>
              );
            }

            // Assistant messages with video-matching tool cards
            return (
              <div key={message.id} className="space-y-2 animate-fade-in">
                {message.parts.map((part, i) => {
                  if (part.type === "reasoning") {
                    const isStreaming = part.state === "streaming";
                    return (
                      <div
                        key={i}
                        className="rounded-lg border border-white/6 bg-[#14151b] p-3 text-xs text-zinc-300 space-y-1.5"
                      >
                        <div className="flex items-center gap-1.5 text-amber-400/80 font-medium">
                          <Wand2 className={`size-3 shrink-0 ${isStreaming ? "animate-pulse" : ""}`} />
                          <span className="text-[10px] uppercase tracking-wider">
                            {part.text ? "Agent reasoning" : "Thinking..."}
                          </span>
                        </div>
                        {part.text && (
                          <p className="text-[12px] leading-relaxed text-zinc-400 font-sans">
                            {part.text}
                          </p>
                        )}
                      </div>
                    );
                  }

                  if (part.type === "text" && part.text?.trim()) {
                    return (
                      <div
                        key={i}
                        className="rounded-xl border border-white/6 bg-[#16171e] p-3 text-xs leading-relaxed text-zinc-200"
                      >
                        {part.text}
                      </div>
                    );
                  }

                  if (isToolUIPart(part) || isDynamicToolUIPart(part)) {
                    const toolName = isDynamicToolUIPart(part)
                      ? part.toolName
                      : part.type.replace(/^tool-/, "");
                    const isDone = part.state === "output-available";
                    const args = (part as any).args || (part as any).input;

                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-all ${
                          isDone
                            ? "border-white/6 bg-[#16171e] hover:bg-[#1a1c24] text-zinc-300"
                            : "border-amber-500/25 bg-amber-500/5 text-amber-200 animate-pulse"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                              isDone
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {isDone ? "✓" : "◌"}
                          </span>
                          <span className="font-mono text-[11px] text-zinc-300 truncate">
                            {formatToolSummary(toolName, args)}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            );
          })
        )}

        {isBusy && (
          <div className="flex items-center gap-2 text-xs text-amber-400/90 py-1 px-1 animate-pulse">
            <span className="inline-flex gap-1">
              <span className="size-1.5 animate-bounce rounded-full bg-amber-400 [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-amber-400 [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-amber-400" />
            </span>
            <span className="font-medium text-xs">Agent is working on canvas & doc...</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200 space-y-2">
            <p>
              {error.message?.includes(PROMPT_LIMIT_ERROR) ? (
                <>
                  You&apos;re out of agent prompts this month.{" "}
                  <button
                    type="button"
                    onClick={() => openUpgrade(UPGRADE_REASONS.prompts)}
                    className="font-medium text-amber-400 underline"
                  >
                    Upgrade
                  </button>
                </>
              ) : (
                "The agent request was interrupted or timed out. Please try again."
              )}
            </p>
            {!error.message?.includes(PROMPT_LIMIT_ERROR) && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-white/20 bg-white/5 hover:bg-white/10"
                onClick={handleRetry}
              >
                Retry
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Floating Prompt Input Bar matching reference video */}
      <div className="shrink-0 p-3 border-t border-white/6 bg-[#0f1015]">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#16171f] p-1.5 shadow-lg focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/15 transition-all">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Sparkles className="size-3.5" />
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={submitOnEnter(handleSend)}
            placeholder="Ask the agent..."
            rows={1}
            disabled={!isReady}
            className="max-h-32 flex-1 resize-none bg-transparent px-1 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none disabled:opacity-50"
          />

          <MicButton value={input} onChange={setInput} disabled={!isReady} className="size-7 rounded-xl hover:bg-white/5" />

          {isBusy ? (
            <button
              type="button"
              onClick={stop}
              title="Stop agent"
              className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-white/10 text-zinc-300 hover:bg-white/15 transition-all cursor-pointer"
            >
              <Square className="size-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || !isReady}
              title="Send prompt"
              className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-[#f59e0b] hover:bg-[#ea580c] text-black font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <ArrowUp className="size-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
