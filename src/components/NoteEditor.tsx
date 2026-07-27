"use client";

import { useCallback, useRef } from "react";
import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from "@milkdown/kit/core";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import { history } from "@milkdown/kit/plugin/history";
import { TextSelection } from "@milkdown/kit/prose/state";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import "@milkdown/kit/prose/view/style/prosemirror.css";
import { imeEnterGuard } from "./imeEnterGuard";
import styles from "./NoteEditor.module.css";

interface NoteEditorProps {
  initialBody: string;
  /** Changing this remounts the editor with a fresh initialBody (new note / external sync / switching files). */
  resetKey: string | number;
  onChange: (markdown: string) => void;
  /** Fires when the editor gains focus (typing starts, or the empty-area tap-to-focus below fires). */
  onFocus?: () => void;
}

function NoteEditorInner({
  initialBody,
  onChange,
  onFocus,
}: Pick<NoteEditorProps, "initialBody" | "onChange" | "onFocus">) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;

  const { get } = useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, initialBody);
        const listenerManager = ctx.get(listenerCtx);
        listenerManager.markdownUpdated((_ctx, markdown, prevMarkdown) => {
          if (markdown !== prevMarkdown) onChangeRef.current(markdown);
        });
        listenerManager.focus(() => onFocusRef.current?.());
      })
      .use(imeEnterGuard)
      .use(commonmark)
      .use(listener)
      .use(history);
  }, []);

  // The actual contenteditable is only as tall as its text, so tapping the mostly-empty
  // lower area of the card (very common with one finger, thumb-reach-wise) wouldn't
  // normally focus anything. Catch clicks outside the real editor DOM and forward focus
  // to the end of the document, same as tapping just past the last line usually does.
  const focusAtEnd = useCallback(() => {
    const editor = get();
    if (!editor) return;
    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const endPos = view.state.doc.content.size;
      const selection = TextSelection.near(view.state.doc.resolve(endPos), -1);
      view.dispatch(view.state.tr.setSelection(selection));
      view.focus();
    });
  }, [get]);

  const handleAreaClick = useCallback(
    (e: React.MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".ProseMirror")) {
        focusAtEnd();
      }
    },
    [focusAtEnd]
  );

  return (
    <div className={styles.clickCatcher} onClick={handleAreaClick}>
      <Milkdown />
    </div>
  );
}

/** Full-screen WYSIWYG markdown editor for a single note. Remounts on resetKey change. */
export function NoteEditor({ initialBody, resetKey, onChange, onFocus }: NoteEditorProps) {
  return (
    <div className={styles.wrapper}>
      <MilkdownProvider key={resetKey}>
        <NoteEditorInner initialBody={initialBody} onChange={onChange} onFocus={onFocus} />
      </MilkdownProvider>
    </div>
  );
}
