"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { createWorkspace } from "@/actions/workspace";
import { useFetch } from "@/hooks/use-fetch";
import { MicButton } from "@/components/MicButton";
import { useUpgradeDialog } from "@/components/UpgradeDialog";
import { UPGRADE_REASONS } from "@/lib/plan-limits";
import { submitOnEnter } from "@/lib/utils";

const MAX_NAME_LENGTH = 48;

const EXAMPLE_PROMPTS = [
  "Design a blog database and document each table",
  "Map out a user onboarding flow",
  "Plan the architecture for a chat app",
];

// "design a blog schema: users, posts..." -> "Design a blog schema: users, posts", cut on a word.
function nameFromPrompt(prompt: string) {
  const firstLine = prompt.trim().split("\n")[0];
  const name =
    firstLine.length <= MAX_NAME_LENGTH
      ? firstLine
      : firstLine.slice(0, MAX_NAME_LENGTH).replace(/\s+\S*$/, "");
  const clean = name.replace(/[\s.,:;!?-]+$/, "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

// Creates a workspace from the prompt and opens it; the workspace's agent sends the prompt
// as its first message (see AgentToggleButton).
export function DashboardPrompt() {
  const [prompt, setPrompt] = useState("");
  const router = useRouter();
  const { fn: createWorkspaceFn, loading } = useFetch(createWorkspace);
  const openUpgrade = useUpgradeDialog();
  const busy = loading ?? false;
  
  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || busy) return;
    const result = await createWorkspaceFn(nameFromPrompt(trimmed), trimmed);
    if (!result) return;
    if ("limit" in result) return openUpgrade(UPGRADE_REASONS[result.limit]);
    router.push(`/workspace/${result.workspace.id}?prompt=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="topo-bg mx-auto mb-14 w-full max-w-4xl px-6 py-10 text-center">
      <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">What are we planning today?</h2>
      <p className="mt-2 text-muted-foreground">Describe it, and the agent drafts the doc and the canvas for you.</p>

      <div className="mx-auto mt-7 max-w-3xl rounded-2xl border border-white/12 bg-[#14151c]/90 p-2 text-left shadow-2xl shadow-black/60 backdrop-blur-xl transition-all focus-within:border-amber-500/50 focus-within:ring-4 focus-within:ring-amber-500/10">
        <div className="flex items-start gap-2.5 p-1.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mt-0.5">
            <span className="text-base font-bold">✦</span>
          </div>
          <div className="flex-1 min-w-0">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={submitOnEnter(handleSubmit)}
              placeholder="Map out our SaaS architecture, then write the spec..."
              rows={2}
              disabled={busy}
              autoFocus
              className="field-sizing-content max-h-60 min-h-12 w-full resize-none bg-transparent px-1 pt-1 text-sm md:text-base leading-6 text-zinc-100 outline-none placeholder:text-zinc-500"
            />
            <div className="mt-1 flex items-center justify-between gap-2 pt-1 border-t border-white/5">
              <span className="text-[11px] text-zinc-500">Shift + Enter for a new line</span>
              <div className="flex items-center gap-2">
                <MicButton value={prompt} onChange={setPrompt} disabled={busy} className="size-8 rounded-xl hover:bg-white/5 text-zinc-400" />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || busy}
                  aria-label="Create workspace"
                  className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#f59e0b] hover:bg-[#ea580c] text-black font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer shadow-md shadow-amber-500/25"
                >
                  <ArrowUp className="size-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-5 flex max-w-3xl flex-wrap justify-center gap-2">
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setPrompt(example)}
            disabled={busy}
            className="rounded-full border border-white/8 bg-[#161720] px-3.5 py-1.5 text-xs text-zinc-400 transition-all hover:border-amber-500/40 hover:text-zinc-100 hover:bg-[#1a1c27] hover:scale-[1.02] cursor-pointer shadow-sm"
          >
            {example}
          </button>
        ))}
      </div>
    </section>
  );
}
