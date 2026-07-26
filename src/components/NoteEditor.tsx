"use client";

import { useRef } from "react";
import { Editor, rootCtx, defaultValueCtx } from "@milkdown/kit/core";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import { history } from "@milkdown/kit/plugin/history";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import "@milkdown/kit/prose/view/style/prosemirror.css";
import styles from "./NoteEditor.module.css";

interface NoteEditorProps {
  initialBody: string;
  /** Changing this remounts the editor with a fresh initialBody (new note / external sync / switching files). */
  resetKey: string | number;
  onChange: (markdown: string) => void;
}

function NoteEditorInner({
  initialBody,
  onChange,
}: Pick<NoteEditorProps, "initialBody" | "onChange">) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, initialBody);
        ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, prevMarkdown) => {
          if (markdown !== prevMarkdown) onChangeRef.current(markdown);
        });
      })
      .use(commonmark)
      .use(listener)
      .use(history);
  }, []);

  return <Milkdown />;
}

/** Full-screen WYSIWYG markdown editor for a single note. Remounts on resetKey change. */
export function NoteEditor({ initialBody, resetKey, onChange }: NoteEditorProps) {
  return (
    <div className={styles.wrapper}>
      <MilkdownProvider key={resetKey}>
        <NoteEditorInner initialBody={initialBody} onChange={onChange} />
      </MilkdownProvider>
    </div>
  );
}
