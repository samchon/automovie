import type { IHumanViewerStartup } from "./IHumanViewerStartup";
import type { IHumanViewerStartupPhase } from "./IHumanViewerStartupPhase";

/**
 * Own what the server is doing while it starts. Each later step is logged as
 * a `STARTUP` line when it begins, so server.log shows where a slow start
 * spends its time.
 *
 * @evidence contracts/common.md#clear-and-simple-design One owner holds the step and its log line.
 * @evidence contracts/common.md#meaningful-documentation States the log line and its purpose.
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
    phase: (name) => {
      startup.phase = name;
      startup.since = new Date().toISOString();
      console.log(`STARTUP ${startup.since} ${name}`);
    },
  };
}
