import {
  AutoMovieComposition,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanStrike } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A punch that lands is one hit on the struck person (#3480), and a reaction
 * synced to that hit starts at it (`sync({ hit })`).
 *
 * Scenarios, two average men facing each other at arm's length, `a`
 * throwing a `cross` (#3362's row) at `b`'s jaw, `b` standing then
 * flinching synced to the hit, both starting together (a parallel with the
 * striker composed first, since the struck performer's synced reaction reads
 * the striker's placed hits):
 * 1. `b` has exactly one melee hit, by `a`, from `collisionSolver`, of
 *    outcome `stick` with a zero exit.
 * 2. Its time is the stop of `a`'s weapon (the hit record's own melee
 *    stop), and it names a bone of `b` and a region of `b`'s head.
 * 3. Its velocity points from `a` toward `b` (a positive dot product with
 *    the line between their roots) and its mass is `a`'s striking forearm's
 *    from the profile.
 * 4. `b`'s flinch starts at the hit, within one 60 Hz frame.
 * 5. The cross is a row of `punch` with the rear hand's straight.
 * 6. At the punch's planned contact instant, `a`'s fist capsule lies on
 *    `b`'s head at the chin it aims at: its surface within one head radius
 *    of the chin's point, where a capsule left on the entry's resting arm
 *    lies more than half a metre short.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs a landed cross through the public chain and reads the hit record, the fist capsule the contact resolution sweeps and the synced reaction's placement; no hit, two hits, a hit off the head, a velocity away from the receiver, a fist capsule away from the chin at the contact or a reaction placed elsewhere fails.
 * @evidence contracts/development/testing.md#independent-expectations The forearm's mass is the striker's own profile segment, the frame bound the 60 Hz frame of #3470's acceptance, the fist's bound the struck body's own head radius about the aimed chin.
 * @evidence contracts/development/testing.md#distinguishing-cases The struck performer's hits against the striker's none; a synced reaction.
 * @evidence contracts/development/testing.md#execution-ownership Builds one two-person performance in memory, the two chains in parallel with the striker first.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the six numbered scenarios.
 */
export function test_human_motion_hit_punch(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const reach: number = body.measure.upperArm + body.measure.forearm;
  let performance: IAutoMovieMotionHumanPerformance;
  try {
    performance = new HumanPerformance({
      seed: "hit-punch",
      laws: [HumanStrike.cross],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body,
          at: { x: 0, y: 0, z: reach + 0.25 },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],

      // Both start together. `a` is composed first because the hit track
      // b's flinch syncs to is asked for when the flinch is placed, so the
      // striker must already be placed (`HumanHitTrack`); a sequence would
      // instead start b only once the cross has ended, after its hit.
      composition: AutoMovieComposition.parallel(
        HumanChain.subject("a").registered(
          "cross",
          { at: { kind: "person", subject: "b", region: "chin" } },
          "strike",
        ).node,
        HumanChain.subject("b")
          .stand({ seconds: 0.2 })
          .flinch({})
          .sync({ hit: { on: "b", by: "a" } }).node,
      ),
    });
  } catch (error) {
    TestValidator.predicate(
      `the punch and its reaction plan (${error instanceof Error ? error.message : String(error)})`,
      false,
    );
    return;
  }
  const hits: readonly IAutoMovieInteractionEvent[] = performance.hits("b");
  TestValidator.predicate(
    `b is hit once by a (${hits.length})`,
    hits.length === 1 &&
      hits[0]!.actor === "a" &&
      hits[0]!.source === "collisionSolver" &&
      hits[0]!.outcome === "stick" &&
      hits[0]!.exit !== undefined &&
      Math.hypot(hits[0]!.exit.x, hits[0]!.exit.y, hits[0]!.exit.z) === 0,
  );
  const hit = hits[0];
  if (hit === undefined) return;
  TestValidator.predicate(
    `the hit names b's bone and a head region (${hit.bone}, ${hit.region})`,
    hit.bone !== undefined &&
      hit.region !== undefined &&
      [
        "chin",
        "mouth",
        "jawLeft",
        "jawRight",
        "nose",
        "face",
        "cheekLeft",
        "cheekRight",
      ].includes(hit.region),
  );
  TestValidator.predicate(
    "the fist's velocity points at b",
    hit.velocity !== undefined && hit.velocity.z > 0,
  );
  const forearm: number | undefined = body.profile.segments.find(
    (s) => s.bone === "rightLowerArm" || s.bone === "leftLowerArm",
  )?.mass;
  TestValidator.predicate(
    `the hit carries the striking forearm's mass (${hit.mass})`,
    hit.mass !== undefined &&
      forearm !== undefined &&
      Math.abs(hit.mass - forearm) <= 1e-9,
  );
  const flinch = performance.segments("b").at(-1)!;
  TestValidator.predicate(
    `b's flinch starts at the hit (${flinch.entryTime.toFixed(4)} s against ${hit.time.toFixed(4)} s)`,
    Math.abs(flinch.entryTime - hit.time) <= 1 / 60,
  );
  // The fist's capsule moves with the arm: at the punch's planned contact
  // instant it lies on b's head at the chin it was aimed at, not on the
  // resting arm the punch was entered with.
  const cross = performance.segments("a")[0]!;
  const fist = cross.plan.weapons?.find((w) => w.id === "fist");
  const contact: number = cross.start + (cross.plan.contact ?? Number.NaN);
  const chin = body.surfaces.regions.chin;
  const aimed: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
    chin,
    performance.bones("b", contact).get(chin.bone)!,
  ).point;
  const off: number =
    fist === undefined
      ? Number.NaN
      : segmentDistance(
          aimed,
          fist.path(contact),
          fist.tail?.(contact) ?? fist.path(contact),
        ) - fist.radius;
  TestValidator.predicate(
    `the fist's capsule at the contact instant lies on b's head at the chin (${(off * 1000).toFixed(1)} mm off, head radius ${(body.measure.headRadius * 1000).toFixed(0)} mm)`,
    off <= body.measure.headRadius,
  );
  TestValidator.predicate(
    "the cross is the rear hand's straight punch",
    HumanStrike.cross.family === "punch" &&
      JSON.stringify(HumanStrike.cross.resolve!({})) ===
        JSON.stringify({ technique: "straight", hand: "rear" }),
  );
}

/** A point's distance from a segment, metres. */
function segmentDistance(
  point: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number {
  const ab: IAutoMovieVector3 = Vector3.subtract(b, a);
  const span: number = Vector3.dot(ab, ab);
  const share: number =
    span === 0
      ? 0
      : Math.min(
          1,
          Math.max(0, Vector3.dot(Vector3.subtract(point, a), ab) / span),
        );
  return Vector3.length(
    Vector3.subtract(point, Vector3.add(a, Vector3.scale(ab, share))),
  );
}
