"use client";

import { useMemo, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Tldraw,
  atom,
  computed,
  createTLCurrentUser,
  createUserId,
  getUserPreferences,
  UserRecordType,
  DefaultToolbar,
  DefaultToolbarContent,
  DefaultNavigationPanel,
  inlineBase64AssetStore,
  defaultShapeUtils,
  defaultBindingUtils,
  type Editor,
  type TLEditorSnapshot,
  type TLComponents,
} from "tldraw";
import { useSync } from "@tldraw/sync";
import "tldraw/tldraw.css";
import { saveCanvasContent } from "@/actions/canvas";
import type { Prisma } from "@/lib/generated/prisma/client";
import { EntityTableShapeUtil } from "@/components/EntityTable/EntityTableShapeUtil";
import { AddEntityTableButton } from "@/components/EntityTable/AddEntityTableButton";
import { snapArrowBindingToRow } from "@/components/EntityTable/snapArrowToRow";
import { useWorkspaceEditors } from "@/components/WorkspaceEditorsContext";
import { colorForUser } from "@/lib/utils";

const SAVE_DEBOUNCE_MS = 1000;
const shapeUtils = [EntityTableShapeUtil];
const SYNC_URL = process.env.NEXT_PUBLIC_TLDRAW_SYNC_URL;
const syncShapeUtils = [...defaultShapeUtils, ...shapeUtils];

const components: TLComponents = {
  StylePanel: null,
  PageMenu: null,
  MainMenu: null,
  NavigationPanel: DefaultNavigationPanel,
  Toolbar: () => (
    <DefaultToolbar orientation="horizontal">
      <DefaultToolbarContent />
      <AddEntityTableButton />
    </DefaultToolbar>
  ),
};

function useCanvasListeners(
  workspaceId: string,
  initialSnapshot: TLEditorSnapshot | null,
  setCanvasEditor: (editor: Editor | null) => void
) {
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMount = (editor: Editor) => {
    setCanvasEditor(editor);

    if (initialSnapshot && editor.getCurrentPageShapeIds().size === 0) {
      editor.loadSnapshot(initialSnapshot);
    }

    editor.store.listen(
      () => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
          const plainSnapshot = JSON.parse(
            JSON.stringify(editor.getSnapshot())
          ) as Prisma.InputJsonValue;
          saveCanvasContent(workspaceId, plainSnapshot);
        }, SAVE_DEBOUNCE_MS);
      },
      { source: "user", scope: "document" }
    );

    editor.store.listen(
      (entry) => {
        for (const record of Object.values(entry.changes.added)) {
          if (record.typeName === "binding" && record.type === "arrow") {
            snapArrowBindingToRow(editor, record);
          }
        }
      },
      { source: "user", scope: "all" }
    );

    return () => setCanvasEditor(null);
  };

  return handleMount;
}

function SyncedCanvas({
  workspaceId,
  initialSnapshot,
  currentUser,
  users,
  syncUrl,
}: {
  workspaceId: string;
  initialSnapshot: TLEditorSnapshot | null;
  currentUser: any;
  users: any;
  syncUrl: string;
}) {
  const { setCanvasEditor } = useWorkspaceEditors();
  const handleMount = useCanvasListeners(workspaceId, initialSnapshot, setCanvasEditor);
  const store = useSync({
    uri: `${syncUrl}/connect/outpost-${workspaceId}`,
    assets: inlineBase64AssetStore,
    shapeUtils: syncShapeUtils,
    bindingUtils: defaultBindingUtils,
    users,
  });

  return (
    <Tldraw
      store={store}
      user={currentUser}
      onMount={handleMount}
      components={components}
      colorScheme="dark"
      shapeUtils={shapeUtils}
      licenseKey={process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY}
    />
  );
}

function StandaloneCanvas({
  workspaceId,
  initialSnapshot,
  currentUser,
}: {
  workspaceId: string;
  initialSnapshot: TLEditorSnapshot | null;
  currentUser: any;
}) {
  const { setCanvasEditor } = useWorkspaceEditors();
  const handleMount = useCanvasListeners(workspaceId, initialSnapshot, setCanvasEditor);

  return (
    <Tldraw
      snapshot={initialSnapshot ?? undefined}
      user={currentUser}
      onMount={handleMount}
      components={components}
      colorScheme="dark"
      shapeUtils={shapeUtils}
      licenseKey={process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY}
    />
  );
}

export function CanvasEditor({
  workspaceId,
  initialSnapshot,
}: {
  workspaceId: string;
  initialSnapshot: TLEditorSnapshot | null;
}) {
  const { user } = useUser();
  const userId = user?.id;
  const userName = user?.fullName ?? user?.username ?? "Anonymous";
  const userImageUrl = user?.imageUrl ?? "";

  const users = useMemo(() => {
    if (!userId) return undefined;
    return {
      currentUser: atom(
        "currentUser",
        UserRecordType.create({
          id: createUserId(userId),
          name: userName,
          color: colorForUser(userId),
          imageUrl: userImageUrl,
        })
      ),
    };
  }, [userId, userName, userImageUrl]);

  const currentUser = useMemo(() => {
    if (!userId) return undefined;
    return createTLCurrentUser({
      userPreferences: computed("clerkUserPreferences", () => ({
        ...getUserPreferences(),
        id: userId,
        name: userName,
        color: colorForUser(userId),
      })),
    });
  }, [userId, userName]);

  return (
    <div className="isolate h-full relative [&_.tlui-layout__bottom]:bottom-4!">
      {SYNC_URL ? (
        <SyncedCanvas
          workspaceId={workspaceId}
          initialSnapshot={initialSnapshot}
          currentUser={currentUser}
          users={users}
          syncUrl={SYNC_URL}
        />
      ) : (
        <StandaloneCanvas
          workspaceId={workspaceId}
          initialSnapshot={initialSnapshot}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
