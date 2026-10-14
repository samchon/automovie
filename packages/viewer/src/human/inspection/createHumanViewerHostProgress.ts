import type { IHumanViewerHealthQueue } from "@automovie/viewer/human/inspection/IHumanViewerHealthQueue";
import type { IHumanViewerHostProgress } from "@automovie/viewer/human/inspection/IHumanViewerHostProgress";

/**
 * Own the host page's progress line: once a second it says what is being built, for how long, and how many requests wait in the local service's numeric queue counters. `settle` stops it and clears the line. Polls do not overlap within one build; beginning another build or settling aborts its previous health request. Elapsed wall-clock seconds are telemetry, not a timeout or acceptance rule. Transport, JSON decoding and thrown property access report unavailable telemetry; successful JSON is not schema-validated, so malformed counter values need not throw and can produce nonnumeric text.
 *
 * @evidence contracts/common.md#principled-implementation A build generation gates late status effects, one-second telemetry polling skips overlap, and native AbortController withdraws the owned health request when its build ends or is replaced.
 * @evidence contracts/common.md#clear-and-simple-design The progress owner manages one status element, polling timer and request while actual build, capture queue and admission remain separate product owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Elapsed time does not retire healthy numerical work, caught transport/decode/access errors report unavailable telemetry, and the unchecked local-service numeric-counter premise is not described as runtime shape admission.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies cadence, nonoverlap, abortion, wall-clock semantics and distinguishes thrown decoding/access from malformed counters that can still format.
 * @evidence contracts/performance.md#efficient-algorithms Under the local-service numeric-counter premise, each response scans q counters and formats its actual status characters; one in-flight request per current build prevents an interval-sized slow-response backlog.
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
    waiting = setInterval((): void => {
      void draw();
    }, 1000);
  };
  return { begin, settle };
}
