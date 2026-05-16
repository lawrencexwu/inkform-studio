"use client";

import { Panel, TextField } from "./ui";
import type { EditorProps } from "./editorProps";

export default function TextControls({ state, patchText }: EditorProps) {
  const t = state.text;
  return (
    <Panel title="文字" sub="Text">
      <TextField
        label="標題"
        sub="Title"
        value={t.title}
        onChange={(v) => patchText({ title: v })}
        placeholder="山高月小"
      />
      <TextField
        label="正文"
        sub="Body"
        value={t.body}
        multiline
        rows={5}
        onChange={(v) => patchText({ body: v })}
        placeholder="輸入詩句或長文…"
      />
      <TextField
        label="落款"
        sub="Signature"
        value={t.signature}
        onChange={(v) => patchText({ signature: v })}
        placeholder="癸巳春日"
      />
      <TextField
        label="印文"
        sub="Seal text"
        value={t.seal}
        onChange={(v) => patchText({ seal: v, })}
        placeholder="墨象"
      />
    </Panel>
  );
}
