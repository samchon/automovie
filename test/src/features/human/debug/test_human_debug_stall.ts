import { HumanDebugStall } from "../../../../../packages/human/debug/server/HumanDebugStall";

/**
 * A capture page that holds a frame while its main thread does no work counts as stalled, and a
 * working page never does, so the debug viewer's generation slot cannot stay held by a page that
 * waits on nothing.
 *
 * Scenarios:
 * 1. Readings every 5 s over 90 s whose task time stops growing after 20 s read stalled.
 * 2. Readings every 5 s over 90 s that grow by 0.5 s per reading read working.
 * 3. Readings that span less than the window read working, however idle.
 * 4. Readings idle for the window but for one burst inside it read working.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `HumanDebugStall.stalled` on made reading series of the page's `TaskDuration` and the server's clock. It catches a rule that never fires on an idle page (the stall of 2026-11-04: a slot held over ten minutes with no process computing), one that fires on a working page, and one that fires before the window has passed.
 * @evidence contracts/development/testing.md#independent-expectations Each expectation follows from the rule's own statement: a page whose task time grew by less than `LEAST` over the last `WINDOW` is stalled; the series are built from those two constants, so the test holds when they are retuned.
 * @evidence contracts/development/testing.md#distinguishing-cases Red: the idle series. Green: the working series, the short series and the series with one burst inside the window.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_debug_stall`; it starts no server, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Readings every 5 s over 90 s whose task time stops growing after 20 s read stalled.).
 */
export function test_human_debug_stall(): void {
  const failures: string[] = [];
  const every: number = HumanDebugStall.EVERY;
  const span: number = HumanDebugStall.WINDOW + 30_000;
  const series: (
    work: (at: number) => number,
    length?: number,
  ) => HumanDebugStall.ISample[] = (
    work: (at: number) => number,
    length: number = span,
  ): HumanDebugStall.ISample[] =>
    Array.from(
      { length: Math.floor(length / every) + 1 },
      (_: unknown, i: number): HumanDebugStall.ISample => ({
        at: i * every,
        work: work(i * every),
      }),
    );

  // 1. Idle after 20 s.
  if (
    !HumanDebugStall.stalled(
      series((at: number): number => Math.min(at, 20_000) / 1000),
    )
  )
    failures.push("a page idle for more than the window did not read stalled");

  // 2. Working throughout.
  if (
    HumanDebugStall.stalled(series((at: number): number => (at / every) * 0.5))
  )
    failures.push("a working page read stalled");

  // 3. Idle but shorter than the window.
  if (
    HumanDebugStall.stalled(
      series((): number => 0, HumanDebugStall.WINDOW - every),
    )
  )
    failures.push("a page idle for less than the window read stalled");

  // 4. One burst of twice the least work inside the last window.
  const burst: number = span - HumanDebugStall.WINDOW / 2;
  if (
    HumanDebugStall.stalled(
      series((at: number): number =>
        at >= burst ? 2 * HumanDebugStall.LEAST : 0,
      ),
    )
  )
    failures.push("a page with a burst of work inside the window read stalled");

  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
