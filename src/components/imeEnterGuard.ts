import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { $prose } from "@milkdown/kit/utils";

const key = new PluginKey("ime-enter-guard");

// Legacy IME confirm-keypress marker some browsers (notably iOS Safari) still use;
// event.isComposing can briefly report false around the same keystroke.
const LEGACY_IME_KEYCODE = 229;

// How long after compositionend a stray insertLineBreak is still treated as
// part of the same IME confirmation rather than a deliberate new Enter press.
// Kept short: the spurious event fires effectively in the same tick as
// compositionend, so a wide window only adds risk of swallowing a real Enter
// (and confusing the on-screen keyboard's focus state) without catching more bugs.
const GRACE_MS = 60;

/**
 * Guards against the extra line break that Japanese/Chinese/Korean IME input commonly
 * triggers when confirming a conversion:
 *
 * 1. Desktop browsers mostly fire a real `keydown` (key: "Enter") to confirm — some
 *    (and older WebKit) still mark it with the legacy keyCode 229 or isComposing races.
 * 2. iOS Safari's on-screen keyboard often skips synthetic keydown entirely and instead
 *    fires `compositionend` immediately followed by a `beforeinput` with
 *    `inputType: "insertLineBreak"` for the very same confirming tap — which ProseMirror
 *    then dutifully inserts as a real hard break, visible as a stray `<br />`-only list
 *    item in the saved markdown.
 *
 * Both paths are swallowed here instead of just the keydown case.
 */
export const imeEnterGuard = $prose(() => {
  let composing = false;
  let clearTimer: ReturnType<typeof setTimeout> | undefined;

  const startGrace = () => {
    if (clearTimer) clearTimeout(clearTimer);
    clearTimer = setTimeout(() => {
      composing = false;
    }, GRACE_MS);
  };

  return new Plugin({
    key,
    props: {
      handleDOMEvents: {
        compositionstart: () => {
          if (clearTimer) clearTimeout(clearTimer);
          composing = true;
          return false;
        },
        compositionend: () => {
          // Composition just committed; keep the guard up briefly since iOS Safari's
          // confirming beforeinput/insertLineBreak lands right after this, not before.
          startGrace();
          return false;
        },
        beforeinput: (_view, event) => {
          const inputType = (event as InputEvent).inputType;
          if (composing && inputType === "insertLineBreak") {
            event.preventDefault();
            return true;
          }
          return false;
        },
      },
      handleKeyDown: (_view, event) => {
        if (
          event.key === "Enter" &&
          (composing || event.isComposing || event.keyCode === LEGACY_IME_KEYCODE)
        ) {
          return true;
        }
        return false;
      },
    },
  });
});
