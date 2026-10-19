import { WorkspaceCard, type WorkspaceCardData } from "@/components/WorkspaceCard";

export function RecentWorkspaces({ workspaces }: { workspaces: WorkspaceCardData[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {workspaces.map((workspace, index) => (
        <div
          key={workspace.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <WorkspaceCard workspace={workspace} showStatus />
        </div>
      ))}
    </div>
  );
}
