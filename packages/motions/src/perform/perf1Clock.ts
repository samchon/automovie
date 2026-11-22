/** TEMPORARY perf-1 timing counters; removed after the measurement runs. */
export namespace perf1Clock {
  /** The host's clock and process, where present. */
  interface IHost {
    /** The high-resolution clock. */
    performance: { now: () => number };
    /** The Node process. */
    process?: { on: (event: string, listener: () => void) => void };
  }

  /** Recorded milliseconds by series. */
  export const SERIES: Map<string, number[]> = new Map();

  /** The nesting depth of timed frame evaluations. */
  export let depth: number = 0;

  /** The current time, milliseconds. */
  export function now(): number {
    return (globalThis as unknown as IHost).performance.now();
  }

  /** Record one sample. */
  export function record(name: string, ms: number): void {
    let list: number[] | undefined = SERIES.get(name);
    if (list === undefined) {
      list = [];
      SERIES.set(name, list);
      if (SERIES.size === 1)
        (globalThis as unknown as IHost).process?.on("exit", (): void => {
          for (const [key, values] of SERIES) {
            const sum: number = values.reduce((a: number, b: number): number => a + b, 0);
            const sorted: number[] = [...values].sort((a: number, b: number): number => a - b);
            console.log(
              `PERF1CLOCK ${key} n=${values.length} total=${sum.toFixed(0)}ms mean=${(sum / values.length).toFixed(2)}ms p95=${sorted[Math.floor(sorted.length * 0.95)]!.toFixed(2)}ms worst=${sorted[sorted.length - 1]!.toFixed(2)}ms`,
            );
          }
        });
    }
    list.push(ms);
  }

  /** Enter a timed evaluation; returns its start, or undefined when nested. */
  export function enter(): number | undefined {
    return depth++ === 0 ? now() : undefined;
  }

  /** Leave a timed evaluation. */
  export function leave(name: string, start: number | undefined): void {
    --depth;
    if (start !== undefined) record(name, now() - start);
  }
}
