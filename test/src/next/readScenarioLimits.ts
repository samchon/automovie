import type { IScenarioLimits } from "./IScenarioLimits";

/**
 * Seconds one scenario may run by default: the project's cap on one spec, three
 * minutes, past which a spec is a defect to fix rather than a run to wait on.
 */
const LIMIT: number = 180;

/**
 * Seconds the stall watch waits for a paused main thread's frames (provisional,
 * the current runner's value).
 */
const GRACE: number = 10;

/**
 * Read the scenario clock: `AUTOMOVIE_TEST_SCENARIO_LIMIT` seconds when the
 * environment sets it, three minutes otherwise, with the stall watch's grace.
 * The runner and every scenario process read the same environment, so they hold
 * the same clock.
 *
 * @param environment The environment to read; the process's own by default.
 * @returns The limit and the grace, seconds.
 * @throws An `Error` when the variable is set but is not a positive number.
 */
export function readScenarioLimits(
  environment: NodeJS.ProcessEnv = process.env,
): IScenarioLimits {
  const text: string | undefined = environment.AUTOMOVIE_TEST_SCENARIO_LIMIT;
  const limit: number = text === undefined ? LIMIT : Number(text);
  if (Number.isFinite(limit) === false || limit <= 0)
    throw new Error(
      `AUTOMOVIE_TEST_SCENARIO_LIMIT must be a positive number of seconds, not ${JSON.stringify(text)}.`,
    );
  return { limit, grace: GRACE };
}
