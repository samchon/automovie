import { randomUUID } from "node:crypto";

import type { ICreateHumanViewerGenerationWindowsProps } from "./ICreateHumanViewerGenerationWindowsProps";
import type { IHumanViewerGenerationWindow } from "./IHumanViewerGenerationWindow";

/** Closed windows whose labels are kept for pages still drawing with them. */
const KEPT = 64;

/**
 * Label each viewer candidate with the source revision its code is.
 *
 * A candidate opens a window before it loads (holding compile withdrawal)
 * and closes it once its page and worker modules have loaded. The label is
 * the revision at closing, given only when no file any build reads changed
 * while the window was open (the human compile was held, so the candidate's
 * human modules are the compile that was current when it opened), no
 * edit batch is still being digested, and so the code the candidate loaded
 * is exactly that revision. Otherwise the label is null: the candidate still
 * finishes and draws, the server reports its frames stale, and the edits it
 * missed reach the next candidate. Labels let the server publish a
 * candidate's own revision instead of whatever `/docs` says when it is asked,
 * and admit its cache writes and admission verdicts only when that revision
 * is current. The latest labels are kept for the pages still using them.
 *
 * @evidence contracts/common.md#principled-implementation A revision is published for a candidate only when its loaded code is proven to be that revision; otherwise it is reported stale, never current.
 * @evidence contracts/common.md#clear-and-simple-design One owner opens, closes and labels windows and holds the gate for them.
 * @evidence contracts/common.md#meaningful-documentation States the labelling rule, the null case and the growth bound.
 */
export function createHumanViewerGenerationWindows(
  props: ICreateHumanViewerGenerationWindowsProps,
) {
  const open = new Map<string, IHumanViewerGenerationWindow>();
  const labels = new Map<string, string | null>();
  return {
    /** Open a window and hold compile withdrawal for it; returns its token. */
    open: (): string => {
      const token = randomUUID();
      let close: (label: string | null) => void = () => {};
      const closed = new Promise<string | null>((resolve) => {
        close = resolve;
      });
      open.set(token, { dirty: false, closed, close });
      props.gate.hold();
      return token;
    },

    /** Close a window, label it and release its hold. Unknown tokens are ignored. */
    close: (token: string): void => {
      const window = open.get(token);
      if (window === undefined) return;
      open.delete(token);
      const label =
        !window.dirty && !props.updating() ? props.revision() : null;
      labels.set(token, label);
      for (const old of labels.keys()) {
        if (labels.size <= KEPT) break;
        labels.delete(old);
      }
      props.gate.release();
      window.close(label);
      props.closed();
    },

    /** A file some build reads was edited: every open window's code may be behind. */
    edited: (): void => {
      for (const window of open.values()) window.dirty = true;
    },

    /** The label of a token, waiting while its window is open; undefined for an unknown token. */
    label: async (token: string | null): Promise<string | null | undefined> => {
      if (token === null) return undefined;
      const window = open.get(token);
      if (window !== undefined) return window.closed;
      return labels.has(token) ? labels.get(token)! : undefined;
    },

    /** Whether this token's code is the current revision (its window closed with the current label). */
    current: (token: string | null): boolean =>
      token !== null &&
      labels.has(token) &&
      labels.get(token) === props.revision(),

    /** Close every open window, as when the page that opened them is gone. */
    closeAll: (): void => {
      for (const token of [...open.keys()]) {
        const window = open.get(token)!;
        window.dirty = true;
        open.delete(token);
        labels.set(token, null);
        props.gate.release();
        window.close(null);
      }
    },

    /** Windows open now. */
    holding: (): number => open.size,
  };
}
