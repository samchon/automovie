import type { IHumanViewerStartup } from "./IHumanViewerStartup.js";
import type { IHumanViewerStartupPhase } from "./IHumanViewerStartupPhase.js";

/**
 * Own what the server is doing while it starts. Each later step is logged as a `STARTUP` line when it begins, so server.log shows where a slow start spends its time.
 *
 * @evidence contracts/common.md#principled-implementation Each phase updates the shared startup record with its actual wall-clock start and logs that same value for server diagnosis.
 * @evidence contracts/common.md#clear-and-simple-design One mutable record and one setter connect health observation and startup logging without a separate event history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A phase label reports the current step and timestamp rather than fabricating a completion duration or readiness result.
 * @evidence contracts/common.md#meaningful-documentation The comment defines step-start logging and its purpose in finding slow startup work.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Updating two fixed fields and printing a line chooses no input-sized processing algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every phase transition needs its own timestamp; there is no equivalent expensive work to cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the current phase and timestamp remain in this owner, with no accumulated startup history or timer.
 */
export function createHumanViewerStartupPhase(
  first: string,
): IHumanViewerStartupPhase {
  const startup: IHumanViewerStartup = {
    phase: first,
    since: new Date().toISOString(),
  };
  return {
    startup,
    phase: (name: string): void => {
      startup.phase = name;
      startup.since = new Date().toISOString();
      console.log(`STARTUP ${startup.since} ${name}`);
    },
  };
}
