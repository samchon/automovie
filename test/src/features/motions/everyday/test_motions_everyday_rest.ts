import { AutoMovieEngineKinematics, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRest,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBend
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionHumanBend";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import {
  resolveHumanPosture
} from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import {
  restCrossedArms
} from "../../../../../packages/motions/src/everyday/internal/restCrossedArms";
import {
  restElbowSupport
} from "../../../../../packages/motions/src/everyday/internal/restElbowSupport";
import {
  restGoals
} from "../../../../../packages/motions/src/everyday/internal/restGoals";
import {
  stand
} from "../../../../../packages/motions/src/actions/internal/stand";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a few posed metres. */
const ROUNDING: number = 1e-9;

/**
 * `restGoals` sets both hands' rest goals on a standing posture.
 *
 * - Hands at the side set no goal.
 * - A pocketed hand lays its flat palm on the front pocket and an akimbo hand on
 *   the hip, raised half the waist's height over the hip joint's, each moved
 *   along the region's normal onto the posed surface; their elbows take the
 *   `tucked` and `akimbo` bends.
 * - A chin rest on both fists moves each fist off the one-fist place by its own
 *   depth on the palm side, the left one toward +X.
 * - Crossed arms are `restCrossedArms`'s goals, and a hand under the other elbow
 *   is `restElbowSupport`'s, laid against the other hand's goal.
 *
 * The body is built whole (`humanFixtureBody`): the goals read the posed
 * surfaces and colliders.
 *
 * Scenarios, the average man standing at the origin facing +Z:
 *
 * 1. Both hands at the side set no goal.
 * 2. A left pocket and a right hip: each contact lies on its region's normal line
 *    through the region's point (the hip's raised), and each elbow is its
 *    bend's.
 * 3. A left chin rest alone and with the right: the left fist moves along +X
 *    alone.
 * 4. Crossed arms equal `restCrossedArms`; a right hand under the left elbow of a
 *    left chin rest equals `restElbowSupport` on the left fist.
 */
export async function test_motions_everyday_rest(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const posture: IAutoMovieMotionHumanPosture = stand.posture(
    body,
    { x: 0, y: 0, z: 0 },
    0,
  );
  const goals = (
    left: IAutoMovieMotionHumanRest.Place,
    right: IAutoMovieMotionHumanRest.Place,
  ): Partial<Record<AutoMovieHumanSide, IAutoMovieMotionHumanRest.IGoal>> =>
    restGoals(body, posture, { left, right });
  TestValidator.equals("at the side", goals("side", "side"), {});
  const bones = poseBones(body, resolveHumanPosture(body, posture));
  const onNormal = (
    goal: IAutoMovieMotionHumanRest.IGoal,
    region: "pocketFrontLeft" | "hipRight",
    up: number,
  ): boolean => {
    const frame = body.surfaces.regions[region];
    const surface =
      AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePointNormal(
        frame,
        bones.get(frame.bone)!,
      );
    const off: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      goal.point,
      AutoMovieEngineVector3.add(surface.point, { x: 0, y: up, z: 0 }),
    );
    return (
      AutoMovieEngineVector3.length(AutoMovieEngineVector3.cross(off, AutoMovieEngineVector3.normalize(surface.normal))) <
      ROUNDING
    );
  };
  const elbow = (
    side: AutoMovieHumanSide,
    bend: "tucked" | "akimbo",
  ): IAutoMovieVector3 =>
    AutoMovieMotionHumanBend.arm(
      body,
      { root: posture.root, yaw: posture.yaw },
      side,
      bend,
    );
  const laid = goals("pocket", "hip");
  TestValidator.predicate(
    "a pocket and a hip",
    laid.left!.shape === "flat" &&
      laid.right!.surface === "palm" &&
      onNormal(laid.left!, "pocketFrontLeft", 0) &&
      onNormal(laid.right!, "hipRight", 0.5 * (m.waistHeight - m.hipHeight)) &&
      vclose(laid.left!.elbow!, elbow("left", "tucked"), ROUNDING) &&
      vclose(laid.right!.elbow!, elbow("right", "akimbo"), ROUNDING),
  );
  const one: IAutoMovieVector3 = goals("chinRest", "side").left!.point;
  const both: IAutoMovieVector3 = goals("chinRest", "chinRest").left!.point;
  TestValidator.predicate(
    "the chin on both fists",
    both.x > one.x &&
      nclose(both.y, one.y, ROUNDING) &&
      nclose(both.z, one.z, ROUNDING),
  );
  const chin = goals("chinRest", "elbowSupport");
  TestValidator.equals(
    "crossed and supported",
    [goals("crossed", "crossed"), chin.right],
    [
      restCrossedArms(body, posture),
      restElbowSupport(
        body,
        posture,
        "right",
        chin.left!,
        AutoMovieMotionHumanBend.arm(
          body,
          { root: posture.root, yaw: posture.yaw },
          "right",
          "folded",
        ),
      ),
    ],
  );
}
