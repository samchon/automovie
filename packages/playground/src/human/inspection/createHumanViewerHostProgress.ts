import type { IHumanViewerHealthQueue } from "./IHumanViewerHealthQueue";
import type { IHumanViewerHostProgress } from "./IHumanViewerHostProgress";

/**
 * Own the host page's progress line: once a second it says what is being built, for how long, and how many requests wait in the server queue, or that the server is not answering. `settle` stops it and clears the line. Polls do not overlap within one build; beginning another build or settling aborts its previous health request. Elapsed wall-clock seconds are presentation telemetry, not a numerical timeout or acceptance rule. Malformed health JSON is displayed through the same unavailable-server path.
 *
 * @evidence contracts/common.md#principled-implementation A build generation gates late status effects, one-second telemetry polling skips overlap, and native AbortController withdraws the owned health request when its build ends or is replaced.
 * @evidence contracts/common.md#clear-and-simple-design The progress owner manages one status element, polling timer and request while actual build, capture queue and admission remain separate product owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Elapsed time does not retire healthy numerical work, health transport/shape errors report unavailable telemetry, and no queue result is fabricated while the server fails.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies polling cadence, nonoverlap, request abortion, wall-clock presentation semantics and malformed-health fallback.
 * @evidence contracts/performance.md#efficient-algorithms Each settled health response scans q queue-category counters and formats constant status fields; one in-flight request per current build prevents a slow server from creating an interval-sized backlog.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Polls observe changing live queue telemetry and own no cached build or numerical result; generation identity prevents reuse of an older build's response.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One current interval and health controller are retained; settle/rebegin clear the timer and abort the request. Aborted earlier generations release their closures on native request settlement, so no independent cap on transient abort-settling promises is asserted.
 */
export function createHumanViewerHostProgress(
  progress: HTMLElement,
): IHumanViewerHostProgress {
  let waiting: ReturnType<typeof setInterval> | undefined;
  let generation: number = 0;
  let active: AbortController | undefined;
  const settle: () => void = (): void => {
    ++generation;
    clearInterval(waiting);
    waiting = undefined;
    active?.abort();
    active = undefined;
    progress.textContent = "";
  };
  const begin: (what: string) => void = (what: string): void => {
    const ticket: number = ++generation;
    const started: number = Date.now();
    clearInterval(waiting);
    active?.abort();
    active = undefined;
    const draw: () => Promise<void> = async (): Promise<void> => {
      if (active !== undefined || ticket !== generation) return;
      const controller: AbortController = new AbortController();
      active = controller;
      const seconds: number = Math.round((Date.now() - started) / 1000);
      let busy: string = "";
      try {
        const health: IHumanViewerHealthQueue = (await (
          await fetch("/health", { signal: controller.signal })
        ).json()) as IHumanViewerHealthQueue;
        const count: number = Object.values(health.queue.waiting).reduce(
          (a: number, b: number): number => a + b,
          0,
        );
        busy = count === 0 ? "" : `, server queue ${count}`;
      } catch {
        busy = ", server not answering";
      } finally {
        if (active === controller) active = undefined;
      }
      if (ticket === generation)
        progress.textContent = `building ${what}... ${seconds} s${busy}`;
    };
    void draw();
    waiting = setInterval((): void => { void draw(); }, 1000);
  };
  return { begin, settle };
}
