import type { IAutoMoviePhysicalProfile } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalBalanceReplay } from "../internal/PhysicalBalanceReplay";

/**
 * The balance controller replays its recorded calls bit for bit: for each of
 * the fourteen disturbance cases, at each key frame the recording kept (quiet
 * stance, the push, a step's trigger, unloading, lift-off, mid-swing,
 * touchdown, the landing ramp's end and after it), `advancePhysicalBalance`
 * and `trackPhysicalRoot`, given the recorded inputs and the recorded bodies'
 * states, return and write exactly what they did in the simulation. The
 * recording is the controller's behaviour at the checkpoint it was taken
 * from; a change that moves any output moves the controller.
 *
 * Scenarios:
 *
 * 1. Each fixture's subject rebuilds the profile the recording ran with, its
 *    digest unchanged.
 * 2. Each `advance` record's result, state after and actuation equal the
 *    recording's, as JSON with keys in any order.
 * 3. Each `root` record's task, integral, wrench records and actuation equal
 *    the recording's, as JSON with keys in any order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is replayed, from what, and what equality means.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `advancePhysicalBalance` and `trackPhysicalRoot` on recorded inputs and reads their results and writes.
 * @evidence contracts/development/testing.md#independent-expectations The expectations are the simulation's own recorded outputs at the recorded checkpoint, not values computed by the code under test now.
 * @evidence contracts/development/testing.md#distinguishing-cases Each case and key frame is a separate record; a change to any phase's rule moves the records of the frames that phase acts in.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation over fixture files in the repository; no native world, viewer or simulation run.
 */
export function test_physical_balance_replay(): void {
  // JSON drops a key whose value is undefined, so a key the controller sets
  // again lands last in the replay: compare with keys in sorted order.
  const canonical = (value: unknown): string | undefined =>
    JSON.stringify(value, (_key: string, v: unknown): unknown =>
      v !== null && typeof v === "object" && !Array.isArray(v)
        ? Object.fromEntries(
            Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
          )
        : v,
    );
  const failures: string[] = [];
  const profiles: Partial<Record<string, IAutoMoviePhysicalProfile>> = {};
  for (const name of PhysicalBalanceReplay.list()) {
    const fixture: PhysicalBalanceReplay.IFixture = PhysicalBalanceReplay.load(name);
    const built: IAutoMoviePhysicalProfile = (profiles[fixture.subject] ??=
      PhysicalBalanceReplay.profile(fixture.subject));
    const digest: string = PhysicalBalanceReplay.digest(JSON.stringify(built));
    if (digest !== fixture.body.profileDigest) {
      failures.push(
        `${fixture.case}: the profile's digest is ${digest}, recorded ${fixture.body.profileDigest}`,
      );
      continue;
    }
    for (const record of fixture.records) {
      const replayed: Record<string, unknown> =
        record.kind === "advance"
          ? PhysicalBalanceReplay.advance(fixture, record, built)
          : PhysicalBalanceReplay.root(fixture, record, built);
      for (const key of Object.keys({ ...record.output, ...replayed }))
        if (canonical(replayed[key]) !== canonical(record.output[key]))
          failures.push(
            `${fixture.case} ${record.kind}@${record.seconds}${record.reason ? ` (${record.reason})` : ""}: ${key} differs`,
          );
    }
  }
  TestValidator.equals("balance replay", failures, []);
}
