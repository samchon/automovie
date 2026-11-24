import type { IAutoMoviePhysicalProfile } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalBalanceReplay } from "../internal/PhysicalBalanceReplay";

/**
 * The balance controller replays its recorded calls bit for bit: for each
 * subject's recovery and fall (`PhysicalBalanceReplay.KEY_FIXTURES`), at one
 * frame of each phase the recording kept (quiet stance, the push, the first and
 * last events, mid-swing, the landing; `PhysicalBalanceReplay.keyFrames`),
 * `advancePhysicalBalance`, and `trackPhysicalRoot` at quiet stance and
 * mid-swing, given the recorded inputs and the recorded bodies' states, return
 * and write exactly what the recording holds. A change to any phase's rule
 * moves its frame; the sustained and extra pushes pass the same phases.
 *
 * Scenarios:
 *
 * 1. Each fixture's profile, the stored one for the Human and the primitive's
 *    built in closed form, has the digest the recording took.
 * 2. Each `advance` record's result, state after and actuation equal the
 *    recording's, as JSON with keys in any order.
 * 3. Each `root` record's task, integral, wrench records and actuation equal the
 *    recording's, as JSON with keys in any order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is replayed, from what, and what equality means.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `advancePhysicalBalance` and `trackPhysicalRoot` on recorded inputs and reads their results and writes.
 * @evidence contracts/development/testing.md#independent-expectations The expectations are the simulation's own recorded outputs at the recorded checkpoint, not values computed by the code under test now.
 * @evidence contracts/development/testing.md#distinguishing-cases Each key frame is a separate record of a recovery or a fall, the two paths a step takes; a change to any phase's rule moves the record of the frame that phase acts in. The renamed-anatomy replay is `test_physical_disturbance_anatomy`'s.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation over fixture files in the repository; no native world, viewer or simulation run.
 */
export async function test_physical_balance_replay(): Promise<void> {
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
  for (const name of PhysicalBalanceReplay.KEY_FIXTURES) {
    const fixture: PhysicalBalanceReplay.IFixture =
      await PhysicalBalanceReplay.load(name);
    const built: IAutoMoviePhysicalProfile =
      await PhysicalBalanceReplay.stored(fixture);
    const digest: string = PhysicalBalanceReplay.digest(JSON.stringify(built));
    if (digest !== fixture.body.profileDigest) {
      failures.push(
        `${fixture.case}: the profile's digest is ${digest}, recorded ${fixture.body.profileDigest}`,
      );
      continue;
    }
    for (const index of PhysicalBalanceReplay.keyFrames(fixture)) {
      const record: PhysicalBalanceReplay.IRecord = fixture.records[index]!;
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
