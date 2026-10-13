import type { IHumanViewerStartup } from "./IHumanViewerStartup.js";
import type { IHumanViewerStartupPhase } from "./IHumanViewerStartupPhase.js";

/**
 * Own what the server is doing while it starts. Each later step is logged as
 * a `STARTUP` line when it begins, so server.log shows where a slow start
 * spends its time.
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
