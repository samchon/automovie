import fs from "node:fs";
import { Session } from "node:inspector/promises";
import type { Profiler } from "node:inspector";

/** Optional in-process CPU sampling for the same measured round; opens no debug server or browser. */
export namespace HumanCurveCpuProfile {
  /** One invocation owns the connected session until stop settles. */
  export interface IHandle {
    /** Stops sampling, writes the native CPU profile, disables the profiler and disconnects even on failure. */
    stop(): Promise<Record<string, unknown>>;
  }

  /** Starts the supported Node inspector profiler with a1ms sampling interval, explicitly requested by CLI. */
  export async function start(file: string): Promise<IHandle> {
    const session: Session = new Session();
    session.connect();
    const before: number = performance.now();
    try {
      await session.post("Profiler.enable");
      await session.post("Profiler.setSamplingInterval", { interval: 1000 });
      await session.post("Profiler.start");
    } catch (error: unknown) {
      const failures: Error[] = [tagged("profiler-start", error)];
      try { session.disconnect(); }
      catch (cleanup: unknown) { failures.push(tagged("start-cleanup-disconnect", cleanup)); }
      throw new AggregateError(failures, "CPU profiler start failed; cleanup retained", { cause: error });
    }
    const acknowledged: number = performance.now();
    return {
      stop: async (): Promise<Record<string, unknown>> => {
        const failures: Error[] = [];
        let result: Record<string, unknown> | null = null;
        try {
          const stopped: Profiler.StopReturnType = await session.post("Profiler.stop");
          const finished: number = performance.now();
          fs.writeFileSync(file, JSON.stringify(stopped.profile));
          result = { file, intervalMicroseconds: 1000, requestedPerformanceMilliseconds: before, acknowledgedPerformanceMilliseconds: acknowledged, stoppedPerformanceMilliseconds: finished, profileStartMicroseconds: stopped.profile.startTime, profileEndMicroseconds: stopped.profile.endTime, nodes: stopped.profile.nodes.length, samples: stopped.profile.samples?.length ?? 0, boundary: "This invocation is CPU-sampled and clock-instrumented; native sampled inclusive/self costs are not added to wall-clock phases." };
        } catch (error: unknown) { failures.push(tagged("profiler-stop-or-profile-write", error)); }
        try { await session.post("Profiler.disable"); }
        catch (cleanup: unknown) { failures.push(tagged("cleanup-disable", cleanup)); }
        try { session.disconnect(); }
        catch (cleanup: unknown) { failures.push(tagged("cleanup-disconnect", cleanup)); }
        if (failures.length !== 0) throw new AggregateError(failures, "CPU profile stop/write and cleanup failures", { cause: failures[0] });
        if (result === null) throw new Error("CPU profiler stopped without a result");
        return result;
      },
    };
  }

  /** Preserve the native exception and identify its primary or cleanup boundary. */
  function tagged(stage: string, error: unknown): Error { return new Error(stage + ": " + (error instanceof Error ? error.stack ?? error.message : String(error)), { cause: error }); }
}
