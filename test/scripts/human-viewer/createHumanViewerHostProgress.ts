import type { IHumanViewerHealthQueue } from "./IHumanViewerHealthQueue";
import type { IHumanViewerHostProgress } from "./IHumanViewerHostProgress";

/**
 * Own the host page's progress line: once a second it says what is being
 * built, for how long, and how many requests wait in the server queue, or
 * that the server is not answering. `settle` stops it and clears the line.
 *
 * @evidence contracts/common.md#clear-and-simple-design One owner holds the progress timer and its line.
 * @evidence contracts/common.md#meaningful-documentation States what the line reports and when it stops.
 */
export function createHumanViewerHostProgress(progress: HTMLElement): IHumanViewerHostProgress {
  let waiting: ReturnType<typeof setInterval> | undefined;
  const settle = (): void => {
    clearInterval(waiting);
    progress.textContent = "";
  };
  const begin = (what: string): void => {
    const started = Date.now();
    clearInterval(waiting);
    const draw = async (): Promise<void> => {
      const seconds = Math.round((Date.now() - started) / 1000);
      let busy = "";
      try {
        const health = (await (await fetch("/health")).json()) as IHumanViewerHealthQueue;
        const count = Object.values(health.queue.waiting).reduce((a, b) => a + b, 0);
        busy = count === 0 ? "" : `, server queue ${count}`;
      } catch {
        busy = ", server not answering";
      }
      progress.textContent = `building ${what}... ${seconds} s${busy}`;
    };
    void draw();
    waiting = setInterval(() => void draw(), 1000);
  };
  return { begin, settle };
}
