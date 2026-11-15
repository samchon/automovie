import { AutoMovieComposition } from "@automovie/engine";
import {
  HumanBlast,
  HumanChain,
  HumanHitTrack,
  HumanPerformance,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A hit is an instant a sync addresses (#3480): bystanders synced to the
 * blast that strikes each of them start no earlier than their hit, each
 * after a reaction latency drawn for them, and the same seed replays.
 *
 * Scenarios, six average men in a ring of 3 m around a blast of 5 m radius
 * at 1 s, each standing then flinching synced to their own hit with the
 * `reaction` latency:
 * 1. Each has exactly one hit, at the blast's second.
 * 2. Each flinch starts at or after its hit (within 1e-9 s).
 * 3. The latencies differ between at least two bystanders: each is drawn
 *    for its performer.
 * 4. A second performance of the same input places every flinch at the same
 *    second, bit for bit.
 * 5. The hit track's name is `hit:<on>` and with a striker `hit:<on>:<by>`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places synced reactions on hits through the public chain and reads their placement; a reaction before its hit, one shared latency for everyone or a replay that moves fails.
 * @evidence contracts/development/testing.md#independent-expectations The blast's second is the scene's; the order hit then reaction is the sync's contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Six performers; a replay.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the five numbered scenarios.
 */
export function test_human_motion_hit_sync_latency(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const blast: HumanBlast.IBlast = {
    id: "shell",
    point: { x: 0, y: 0.2, z: 0 },
    at: 1,
    radius: 5,
    impulse: 300,
  };
  const ids: string[] = [0, 1, 2, 3, 4, 5].map((k: number) => `p${k}`);
  const make = (): HumanPerformance =>
    new HumanPerformance({
      seed: "volley",
      blasts: [blast],
      performers: ids.map((subject: string, k: number) => ({
        subject,
        body,
        at: {
          x: 3 * Math.cos((k * Math.PI) / 3),
          y: 0,
          z: 3 * Math.sin((k * Math.PI) / 3),
        },
        yaw: 0,
        proficiency: { level: "trained" as const },
      })),
      composition: AutoMovieComposition.parallel(
        ...ids.map(
          (subject: string) =>
            HumanChain.subject(subject)
              .stand({ seconds: 0.5 })
              .flinch({})
              .sync({ hit: { on: subject }, latency: "reaction" }).node,
        ),
      ),
    });
  let performance: HumanPerformance;
  try {
    performance = make();
  } catch (error) {
    TestValidator.predicate(
      `the volley's reactions plan (${error instanceof Error ? error.message : String(error)})`,
      false,
    );
    return;
  }
  const starts: number[] = [];
  for (const subject of ids) {
    const hits = performance.hits(subject);
    TestValidator.predicate(
      `${subject} is hit once at the blast`,
      hits.length === 1 && Math.abs(hits[0]!.time - 1) <= 1e-12,
    );
    const flinch = performance.segments(subject).at(-1)!;
    starts.push(flinch.entryTime);
    TestValidator.predicate(
      `${subject}'s flinch starts after the hit (${flinch.entryTime.toFixed(4)} s)`,
      hits[0] !== undefined && flinch.entryTime >= hits[0].time - 1e-9,
    );
  }
  TestValidator.predicate(
    "the latencies are drawn per bystander",
    new Set(starts).size > 1,
  );
  const again: HumanPerformance = make();
  TestValidator.equals(
    "a replay places every flinch at the same second",
    ids.map((subject: string) => again.segments(subject).at(-1)!.entryTime),
    starts,
  );
  TestValidator.equals(
    "the hit track's names",
    [HumanHitTrack.name({ on: "b" }), HumanHitTrack.name({ on: "b", by: "a" })],
    ["hit:b", "hit:b:a"],
  );
}
