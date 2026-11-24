import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { floorSeat } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a forward-kinematics chain, metres. */
const ROUNDING: number = 1e-9;

/**
 * `floorSeat.place` moves a posture's legs a share of the way to a folded floor
 * sitting: each ankle to its place in the pelvis's floor frame, in thigh
 * lengths from the floor under the hips' middle, raised half the standing
 * ankle's height, and each knee toward its bend point; side sitting also sets
 * the left hand down, planted once it is there.
 *
 * The body is built whole (`humanFixtureBody`): the legs start from the
 * posture's own joints, placed by forward kinematics.
 *
 * Scenarios, the average man upright:
 *
 * 1. At no share the posture is returned as it is.
 * 2. Tailor sitting facing +Z puts the left ankle `(-0.55 - 0.55, 0, 0.45 - 0.25)`
 *    thighs from the right one: 1.1 thighs to its right and 0.2 ahead, both
 *    half an ankle's height up.
 * 3. Facing +X, that offset turns with the pelvis: 1.1 thighs along +Z and 0.2
 *    along +X.
 * 4. Side sitting plants the left hand at the end, not half way.
 */
export async function test_unit_motions_floor_floor_seat(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const posture: (yaw: number) => IAutoMovieMotionHumanPosture = (
    yaw: number,
  ): IAutoMovieMotionHumanPosture => ({
    root: { x: 0, y: 0.5, z: 0 },
    yaw,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  });
  const upright: IAutoMovieMotionHumanPosture = posture(0);
  TestValidator.predicate(
    "no share",
    floorSeat.place(body, upright, "crossed", 0) === upright,
  );
  const thigh: number = body.measure.thigh;
  const apart: (p: IAutoMovieMotionHumanPosture) => IAutoMovieVector3 = (
    p: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 => {
    const left: IAutoMovieVector3 = p.limbs.leftLeg!.point;
    const right: IAutoMovieVector3 = p.limbs.rightLeg!.point;
    return { x: left.x - right.x, y: left.y - right.y, z: left.z - right.z };
  };
  const crossed: IAutoMovieMotionHumanPosture = floorSeat.place(
    body,
    upright,
    "crossed",
    1,
  );
  TestValidator.predicate(
    "tailor sitting",
    vclose(
      apart(crossed),
      { x: -1.1 * thigh, y: 0, z: 0.2 * thigh },
      ROUNDING,
    ) &&
      nclose(
        crossed.limbs.leftLeg!.point.y,
        floorSeat.ANKLE * body.measure.ankleHeight,
        ROUNDING,
      ),
  );
  TestValidator.predicate(
    "turned",
    vclose(
      apart(floorSeat.place(body, posture(90), "crossed", 1)),
      { x: 0.2 * thigh, y: 0, z: 1.1 * thigh },
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "side sitting",
    floorSeat.place(body, upright, "side", 1).limbs.leftArm?.planted === true &&
      floorSeat.place(body, upright, "side", 0.5).limbs.leftArm?.planted ===
        false,
  );
}
