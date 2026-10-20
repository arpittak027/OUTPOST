import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { WorkspaceStatus } from "@/lib/generated/prisma/enums";
import { statusTitle } from "@/lib/workspace-status";

export type WorkspaceCardData = {
  id: string;
  name: string;
  description: string | null;
  status: WorkspaceStatus;
  lastActivity: Date;
  creator: { name: string | null; imageUrl: string | null };
};

// One card for the board and the dashboard's recent list: title, description, and a Jira-style
// footer (last edit on the left, the creator's avatar on the right). `actions` renders over the
// top-right corner, `showStatus` adds the column name (the board already shows it as the column).
export function WorkspaceCard({
  workspace,
  showStatus = false,
  highlighted = false,
  actions,
}: {
  workspace: WorkspaceCardData;
  showStatus?: boolean;
  highlighted?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className={`group relative flex h-38 flex-col gap-1.5 rounded-xl border p-4 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60 ${
        highlighted
          ? "border-amber-500/60 bg-[#191b26] ring-2 ring-amber-500/20 shadow-amber-500/10"
          : "border-white/8 bg-[#15161f] hover:border-amber-500/40 hover:bg-[#181a25]"
      }`}
    >
      {/* after:inset-0 stretches the link over the whole card, so `actions` can sit on top
          without being nested inside the link. */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/workspace/${workspace.id}`}
          draggable={false}
          className="line-clamp-2 pr-2 text-sm leading-snug font-semibold text-zinc-100 group-hover:text-amber-300 transition-colors after:absolute after:inset-0"
        >
          {workspace.name}
        </Link>
        {actions && <div className="relative z-10 shrink-0">{actions}</div>}
      </div>

      {workspace.description && (
        <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">{workspace.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 text-[11px] text-zinc-400 pt-2 border-t border-white/4">
        {/* Relative time can differ by a minute between the server and browser render. */}
        <span className="flex min-w-0 items-center gap-1.5" suppressHydrationWarning>
          <span className="size-1.5 rounded-full bg-amber-400/80 group-hover:animate-ping" />
          <span className="truncate" suppressHydrationWarning>
            {showStatus && `${statusTitle(workspace.status)} · `}
            {formatDistanceToNow(workspace.lastActivity, { addSuffix: true })}
          </span>
        </span>
        <CreatorAvatar creator={workspace.creator} />
      </div>
    </div>
  );
}

function CreatorAvatar({ creator }: { creator: WorkspaceCardData["creator"] }) {
  const name = creator.name ?? "Unknown";
  return creator.imageUrl ? (
    <Image src={creator.imageUrl} alt={name} title={name} width={20} height={20} className="size-5 shrink-0 rounded-full" />
  ) : (
    <span
      title={name}
      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-foreground"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
