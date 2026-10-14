import { randomUUID } from "node:crypto";
import { reportAutoMovieResourceRetirement } from "../../reportAutoMovieResourceRetirement.js";

import type { ICreateHumanViewerGenerationWindowsProps } from "./ICreateHumanViewerGenerationWindowsProps.js";
import type { IHumanViewerGenerationWindow } from "./IHumanViewerGenerationWindow.js";

/** Closed windows whose labels are kept for pages still drawing with them. */
const KEPT: number = 64;

/**
 * Label each viewer candidate with the source revision its code is.
 *
 * A candidate opens a window before it loads (holding compile withdrawal) and closes it once its page and worker modules have loaded. The label is the revision at closing, given only when no file any build reads changed while the window was open (the human compile was held, so the candidate's human modules are the compile that was current when it opened), no edit batch is still being digested, and so the code the candidate loaded is exactly that revision. Otherwise the label is null: the candidate still finishes and draws, the server reports its frames stale, and the edits it missed reach the next candidate. Labels let the server publish a candidate's own revision instead of whatever `/docs` says when it is asked, and admit its cache writes and admission verdicts only when that revision is current. The latest labels are kept for the pages still using them. Closing always settles the label promise and attempts gate release and closure notification independently, even when one operation fails. Both ordinary and bulk closure retain only the latest 64 closed labels.
 *
 * @evidence contracts/common.md#principled-implementation A candidate window labels its loaded code only when no reached edit dirtied it and no revision batch is outstanding; otherwise closure resolves explicit null authority while releasing its compile hold.
 * @evidence contracts/common.md#clear-and-simple-design Open-window state and a bounded closed-label history separate active source observation from later current-code queries; one remember operation owns retention on both close paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current revision intent cannot prove dirty or still-updating code, and one release failure cannot leave other label promises or independent cleanup attempts unprocessed.
 * @evidence contracts/common.md#meaningful-documentation The prose explains source-proof premises, null authority, held compilation, independent close attempts and the 64-label retention limit.
 * @evidence contracts/performance.md#efficient-algorithms Token lookups use Maps, edits visit each open window once and bulk closure visits its snapshot once; closed-history pruning removes only overflow beyond a fixed 64 entries.
 * @evidence contracts/performance.md#reuse-equivalent-work Concurrent label readers share one window.closed promise; labels remain tied to token/source observation and current queries compare them with the live revision after invalidation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Active windows grow with outstanding candidate holds until connection closure or closeAll, without a numeric active-window cap; all close paths resolve their promises, attempt hold release and bound closed labels to 64.
 */
export function createHumanViewerGenerationWindows(
  props: ICreateHumanViewerGenerationWindowsProps,
): {
  open: () => string;
  close: (token: string) => void;
  edited: () => void;
  label: (token: string | null) => Promise<string | null | undefined>;
  current: (token: string | null) => boolean;
  closeAll: () => void;
  holding: () => number;
} {
  const open: Map<string, IHumanViewerGenerationWindow> = new Map<string, IHumanViewerGenerationWindow>();
  const labels: Map<string, string | null> = new Map<string, string | null>();
  function remember(token: string, label: string | null): void {
    labels.set(token, label);
    for (const old of labels.keys()) {
      if (labels.size <= KEPT) break;
      labels.delete(old);
    }
  }
  return {
    /** Open a window and hold compile withdrawal for it; returns its token. */
    open: (): string => {
      const token: string = randomUUID();
      let close: (label: string | null) => void = (): void => {};
      const closed: Promise<string | null> = new Promise<string | null>((resolve: (value: string | null | PromiseLike<string | null>) => void): void => {
        close = resolve;
      });
      open.set(token, { dirty: false, closed, close });
      props.gate.hold();
      return token;
    },

    /** Close a window, label it and release its hold. Unknown tokens are ignored. */
    close: (token: string): void => {
      const window: IHumanViewerGenerationWindow | undefined = open.get(token);
      if (window === undefined) return;
      let label: string | null = null;
      let failure: { error: unknown } | undefined;
      try {
        label = !window.dirty && !props.updating() ? props.revision() : null;
      } catch (error) {
        failure = { error };
      }
      open.delete(token);
      remember(token, label);
      reportAutoMovieResourceRetirement([
        (): void => props.gate.release(),
        (): void => window.close(label),
        props.closed,
      ], failure);
    },

    /** A file some build reads was edited: every open window's code may be behind. */
    edited: (): void => {
      for (const window of open.values()) window.dirty = true;
    },

    /** The label of a token, waiting while its window is open; undefined for an unknown token. */
    label: async (token: string | null): Promise<string | null | undefined> => {
      if (token === null) return undefined;
      const window: IHumanViewerGenerationWindow | undefined = open.get(token);
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
      const windows: [string, IHumanViewerGenerationWindow][] = [...open];
      if (windows.length === 0) return;
      open.clear();
      for (const [token, window] of windows) {
        window.dirty = true;
        remember(token, null);
      }
      reportAutoMovieResourceRetirement([
        ...windows.flatMap(([, window]: [string, IHumanViewerGenerationWindow]): (() => void)[] => [
          (): void => props.gate.release(),
          (): void => window.close(null),
        ]),
        props.closed,
      ]);
    },

    /** Windows open now. */
    holding: (): number => open.size,
  };
}
