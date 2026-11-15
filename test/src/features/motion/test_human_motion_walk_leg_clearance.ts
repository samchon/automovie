import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditTangle,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
  walkLegClearance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Two legs' clearance is the tangle audit's own reading of them, and its
 * binding piece moves as the reading does.
 *
 * Scenario: the average man stands quietly, then with his left foot set
 * down across the right one, 12 cm to its right and from 30 cm in front of
 * it to 30 cm behind, the knee bent toward a point ahead of the ankle. Each
 * posture is resolved, and the legs are read from its bones: the hips, the
 * knees and the ankles, the thighs', the shanks' and the feet's rotations.
 * `walkLegClearance.excess` equals the deepest pair of the two legs the
 * audit finds (`AutoMovieMotionHumanAuditTangle.pose`) to a nanometre, the
 * audit's own rounding floor, and is none in the quiet stance; at the
 * crossings that pass into each other, moving the crossed leg 0.1 mm
 * forward changes the binding piece (`IReading.at`) as it changes the
 * reading itself, to 1e-6 m per metre.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves real postures and reads the audit on their bones; a clearance that drifts from the audit, or a piece whose slope is not the reading's, fails.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the audit's own reading of the same bones; the crossings and the step are written here.
 * @evidence contracts/development/testing.md#distinguishing-cases The quiet stance, which reads none, against crossings in front and behind, some passing into each other and some clear.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the scenario and its bounds.
 */
export function test_human_motion_walk_leg_clearance(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const quiet: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const right: IAutoMovieVector3 = poseBones(
    body,
    resolveHumanPosture(body, quiet),
  ).get("rightFoot")!.worldPosition;
  const legs = (posture: IHumanPosture) => {
    const bones = poseBones(body, resolveHumanPosture(body, posture));
    const leg = (side: "left" | "right"): walkLegClearance.ILeg => ({
      side,
      hip: bones.get(`${side}UpperLeg`)!.worldPosition,
      knee: bones.get(`${side}LowerLeg`)!.worldPosition,
      ankle: bones.get(`${side}Foot`)!.worldPosition,
      thigh: bones.get(`${side}UpperLeg`)!.worldRotation,
      shank: bones.get(`${side}LowerLeg`)!.worldRotation,
      rotation: bones.get(`${side}Foot`)!.worldRotation,
    });
    let audited: number = 0;
    for (const pair of AutoMovieMotionHumanAuditTangle.pose(body, bones))
      if (LEG.test(pair.a) && LEG.test(pair.b) && pair.a.slice(0, 4) !== pair.b.slice(0, 4))
        audited = Math.max(audited, pair.depth);
    return { left: leg("left"), right: leg("right"), audited };
  };
  const quietLegs = legs(quiet);
  TestValidator.equals("the quiet stance reads none", walkLegClearance.excess(body, quietLegs.left, quietLegs.right), 0);
  let binding: number = 0;
  for (const ahead of [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3]) {
    const ankle: IAutoMovieVector3 = {
      x: right.x - 0.12,
      y: right.y,
      z: right.z + ahead,
    };
    const crossed: IHumanPosture = {
      ...quiet,
      limbs: {
        ...quiet.limbs,
        leftLeg: {
          ...quiet.limbs.leftLeg!,
          point: ankle,
          bend: Vector3.add(ankle, { x: 0, y: 0.5, z: 1 }),
        },
      },
    };
    const read = legs(crossed);
    const reading: walkLegClearance.IReading = walkLegClearance.reading(body, read.left, read.right);
    TestValidator.predicate(
      `the clearance is the audit's reading ${ahead} m ahead`,
      Math.abs(reading.excess - read.audited) <= 1e-9,
    );
    if (reading.excess <= 0) continue;
    binding++;
    const step: number = 1e-4;
    const nudged = (p: IAutoMovieVector3): IAutoMovieVector3 => ({ ...p, z: p.z + step });
    const moved: walkLegClearance.ILeg = {
      ...read.left,
      hip: nudged(read.left.hip),
      knee: nudged(read.left.knee),
      ankle: nudged(read.left.ankle),
    };
    const exact: number = (walkLegClearance.excess(body, moved, read.right) - reading.excess) / step;
    const piece: number = (reading.at(moved, read.right) - reading.excess) / step;
    TestValidator.predicate(`the binding piece moves as the reading ${ahead} m ahead`, Math.abs(exact - piece) <= 1e-6);
  }
  TestValidator.predicate("some crossings pass into each other", binding > 0);
}

/** A leg's bones. */
const LEG: RegExp = /(UpperLeg|LowerLeg|Foot|Toes)$/u;
