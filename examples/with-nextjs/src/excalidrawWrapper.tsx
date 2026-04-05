"use client";
import React, { useRef, useEffect, useCallback, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import "@excalidraw/excalidraw/index.css";

import { useWorkspaces, loadWorkspaceData, saveWorkspaceData } from "./workspaces/useWorkspaces";
import WorkspaceBar from "./workspaces/WorkspaceBar";

import "./excalidrawWrapper.css";

const ExcalidrawWrapper: React.FC = () => {
  const {
    workspaces,
    activeId,
    addWorkspace,
    renameWorkspace,
    removeWorkspace,
    switchWorkspace,
  } = useWorkspaces();

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  // Track the activeId we last loaded so we can save before switching
  const loadedIdRef = useRef<string>("");
  // Track whether the initial load for the current workspace has happened
  const initialLoadDoneRef = useRef(false);

  // Save current scene to localStorage for the given workspace id
  const saveCurrentScene = useCallback(
    (id: string) => {
      if (!excalidrawAPI || !id) return;
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      // Only persist a subset of appState that is meaningful across sessions
      const persistedAppState: Record<string, unknown> = {
        viewBackgroundColor: appState.viewBackgroundColor,
        currentItemFontFamily: appState.currentItemFontFamily,
        theme: appState.theme,
      };
      saveWorkspaceData(id, elements, persistedAppState);
    },
    [excalidrawAPI],
  );

  // When activeId changes (workspace switch), save previous scene and load new one
  useEffect(() => {
    if (!excalidrawAPI || !activeId) return;

    const previousId = loadedIdRef.current;

    // Save previous workspace before switching
    if (previousId && previousId !== activeId) {
      saveCurrentScene(previousId);
    }

    // Load the new workspace
    const { elements, appState } = loadWorkspaceData(activeId);
    excalidrawAPI.updateScene({
      elements,
      appState,
    });
    excalidrawAPI.scrollToContent(undefined, { fitToViewport: true });

    loadedIdRef.current = activeId;
    initialLoadDoneRef.current = true;
  }, [activeId, excalidrawAPI, saveCurrentScene]);

  // Auto-save current scene to localStorage on every change (debounced via onChange)
  const handleChange = useCallback(() => {
    if (!initialLoadDoneRef.current) return;
    saveCurrentScene(loadedIdRef.current);
  }, [saveCurrentScene]);

  const handleSwitch = useCallback(
    (id: string) => {
      saveCurrentScene(loadedIdRef.current);
      switchWorkspace(id);
    },
    [saveCurrentScene, switchWorkspace],
  );

  return (
    <div className="workspace-root">
      <WorkspaceBar
        workspaces={workspaces}
        activeId={activeId}
        onSwitch={handleSwitch}
        onAdd={addWorkspace}
        onRename={renameWorkspace}
        onRemove={(id) => {
          if (id === activeId) {
            // switch first, then remove (useWorkspaces handles the switch internally)
          }
          removeWorkspace(id);
        }}
      />
      <div className="excalidraw-container">
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default ExcalidrawWrapper;
