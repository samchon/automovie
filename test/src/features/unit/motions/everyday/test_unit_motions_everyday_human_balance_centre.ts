import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanBalance } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a mass-weighted forward-kinematics sum, metres. */
const ROUNDING: number = 1e-9;

/**
 * `HumanBalance`'s readings of a posture: the whole-body centre of mass
 * (`centre`), the base of support's points under it (`support`), the margin by
 * which the centre lies inside the base (`margin`) and its offset ahead of the
 * base's middle along the heading (`offset`). They move with the body: a
 * translation moves the centre and the base alike and changes neither the
 * margin nor the offset, and a turn of the heading turns the centre's offset
 * from the root.
 *
 * The body is built whole (`humanFixtureBody`): the centre weighs every
 * segment's mass placed by forward kinematics.
 *
 * Scenarios, the average man upright:
 *
 * 1. The body being left-right symmetric, the centre lies on its midline, x = 0,
 *    between the hips and the shoulders in height.
 * 2. Moved 1 m along +X and 2 m along +Z, the centre and every support point move
 *    by that, and the margin and the offset are unchanged.
 * 3. Turned 90 degrees, the centre's offset from the root turns from (x, z) to (z,
 *    -x).
 */
export async function test_unit_motions_everyday_human_balance_centre(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const posture: (
    root: IAutoMovieVector3,
    yaw: number,
  ) => IAutoMovieMotionHumanPosture = (
    root: IAutoMovieVector3,
    yaw: number,
  ): IAutoMovieMotionHumanPosture => ({
    root,
    yaw,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  });
  const here: IAutoMovieMotionHumanPosture = posture({ x: 0, y: 0, z: 0 }, 0);
  const there: IAutoMovieMotionHumanPosture = posture({ x: 1, y: 0, z: 2 }, 0);
  const centre: IAutoMovieVector3 = HumanBalance.centre(body, here);
  const margin: number = HumanBalance.margin(body, here);
  TestValidator.predicate(
    "on the midline",
    Math.abs(centre.x) < ROUNDING &&
      centre.y > body.measure.hipHeight &&
      centre.y < body.measure.shoulderHeight,
  );
  const support: ReturnType<typeof HumanBalance.support> = HumanBalance.support(
    body,
    here,
  );
  const moved: ReturnType<typeof HumanBalance.support> = HumanBalance.support(
    body,
    there,
  );
  TestValidator.predicate(
    "moved",
    vclose(
      HumanBalance.centre(body, there),
      { x: centre.x + 1, y: centre.y, z: centre.z + 2 },
      ROUNDING,
    ) &&
      moved.points.length === support.points.length &&
      support.points.every((p: IAutoMovieVector3, i: number): boolean =>
        vclose(moved.points[i]!, { x: p.x + 1, y: p.y, z: p.z + 2 }, ROUNDING),
      ) &&
      nclose(HumanBalance.margin(body, there), margin, ROUNDING) &&
      nclose(
        HumanBalance.offset(body, there),
        HumanBalance.offset(body, here),
        ROUNDING,
      ),
  );
  TestValidator.predicate(
    "turned",
    vclose(
      HumanBalance.centre(body, posture({ x: 0, y: 0, z: 0 }, 90)),
      { x: centre.z, y: centre.y, z: -centre.x },
      ROUNDING,
    ),
  );
}
