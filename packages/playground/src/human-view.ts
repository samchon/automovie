import { mountHumanEditor } from "./human-editor/mountHumanEditor";

/** Mount the ordinary public-parameter editor and retire it with its page. */
const root: HTMLElement | null = document.getElementById("app");
if (root === null) throw new Error("Human editor root is missing");
const dispose: () => Promise<void> = mountHumanEditor(root);
window.addEventListener(
  "pagehide",
  (): void => {
    void dispose().catch(console.error);
  },
  { once: true },
);
