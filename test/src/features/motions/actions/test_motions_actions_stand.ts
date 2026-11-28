import type { IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanSupportCarry, IAutoMovieVector3 } from "@automovie/interface";
import {
  standFeet
} from "../../../../../packages/motions/src/actions/internal/standFeet";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";
import { vclose } from "../../internal/vclose";

/** Rounding of a forward-kinematics chain, metres. */
const ROUNDING: number = 1e-9;

/**
 * `standFeet` flattens a quiet stance's planted feet by rolling each about
 * the socket it bears on: `flat` are the settled ankles, `offset` the mean
 * ankle's displacement from them at a share of the course, and `write` sets
 * each leg's goal at the foot's place and rotation, its contact on the
 * bearing socket and its toes unflexed by the end; a support's carry moves
 * the written feet with it.
 *
 * The body is built whole (`humanFixtureBody`): the bearing sockets are read
 * from the entry's pose by forward kinematics over the rig and the surfaces.
 *
 * Scenarios, the average man standing quiet at the origin facing +Z:
 *
 * 1. At the course's end the ankles are the flat ones: the offset is zero.
 * 2. The feet stand on the floor: both flat ankles at one height, at the entry
 *    feet's height.
 * 3. Written at the end, each leg's goal rotation and contact are set and its
 *    toes are unflexed.
 * 4. Carried 1 m along +X by a support, the written legs' goals move 1 m along
 *    +X.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Quiet stance rolls around each bearing socket until both soles are level and follows a moving support.
 * @evidence contracts/development/testing.md#behavioral-verification Calls standing-foot settling on the stored stock body, then applies an explicit one-metre support displacement.
 * @evidence contracts/development/testing.md#independent-expectations The entry soles give independent floor height and bearing points. At the final share offsets vanish and a one-metre move carries both written ankles by that amount.
 */
export async function test_motions_actions_stand(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const context: IAutoMovieMotionHumanActionContext<object> =
    motionActionContext(body, {});
  const course: standFeet.ICourse = standFeet(body, context.entry, 0);
  TestValidator.predicate(
    "the end",
    vclose(course.offset(1), { x: 0, y: 0, z: 0 }, ROUNDING),
  );
  TestValidator.predicate(
    "on the floor",
    Math.abs(course.flat.left.y - course.flat.right.y) < ROUNDING &&
      Math.abs(course.flat.left.y - context.entry.feet.left.ankle.y) < 1e-3,
  );
  const posture: IAutoMovieMotionHumanPosture = context.entry.posture;
  const written: IAutoMovieMotionHumanPosture = course.write(posture, 1);
  TestValidator.predicate(
    "written",
    (["left", "right"] as const).every(
      (side: "left" | "right"): boolean =>
        written.limbs[`${side}Leg`]?.rotation !== undefined &&
        written.limbs[`${side}Leg`]?.contact !== undefined &&
        written.joints[`${side}Toes`]![0] === 0,
    ),
  );
  const carry: IAutoMovieMotionHumanSupportCarry.ICarry = {
    point: (p: IAutoMovieVector3): IAutoMovieVector3 => ({
      ...p,
      x: p.x + 1,
    }),
    turn: { x: 0, y: 0, z: 0, w: 1 },
    yaw: 0,
  };
  const moved: IAutoMovieMotionHumanPosture = course.write(
    { ...posture, root: { ...posture.root, x: posture.root.x + 1 } },
    1,
    carry,
  );
  TestValidator.predicate(
    "carried",
    (["left", "right"] as const).every((side: "left" | "right"): boolean =>
      vclose(
        moved.limbs[`${side}Leg`]!.point,
        {
          ...written.limbs[`${side}Leg`]!.point,
          x: written.limbs[`${side}Leg`]!.point.x + 1,
        },
        ROUNDING,
      ),
    ),
  );
}
