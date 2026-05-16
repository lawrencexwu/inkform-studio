"use client";

import TextControls from "./TextControls";
import LayoutControls from "./LayoutControls";
import type { EditorProps } from "./editorProps";

export default function SidebarLeft(props: EditorProps) {
  return (
    <aside className="w-[300px] shrink-0 border-r border-ink-800 bg-ink-900 overflow-y-auto scroll-thin">
      <TextControls {...props} />
      <LayoutControls {...props} />
    </aside>
  );
}
