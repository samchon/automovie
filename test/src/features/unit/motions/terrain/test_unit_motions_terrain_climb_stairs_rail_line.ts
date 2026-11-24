import type {
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { climbStairsRailLine } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of a rotation and a projection, metres. */
const ROUNDING: number = 1e-12;

/**
 * `climbStairsRailLine` places a stair rail in the world for a sliding grip:
 * the bar's centre through the prop's frame, its axis and up, the hold kept
 * within half its length less half its aperture, and a root read along the axis
 * to where the hand holds.
 *
 * Scenarios, a 2 m bar of 0.1 m aperture 0.9 m up, on a prop at (1, 0, 0):
 *
 * 1. Unturned: centre (1, 0.9, 0), axis +X, up +Y, holding 0.95 m either way.
 * 2. A root at (1.4, 0, 3) holds at (1.4, 0.9, 0); one at (5, 0, 0) at the end,
 *    (1.95, 0.9, 0).
 * 3. Turned a quarter about +Y by the prop, the axis runs along -Z.
 * 4. A bar standing up a post (its axis +Y) is no rail line.
 */
export function test_unit_motions_terrain_climb_stairs_rail_line(): void {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const p = (x: number, y: number, z: number): IAutoMovieVector3 => ({
    x,
    y,
    z,
  });
  const model: IAutoMovieRigidTransform = {
    position: p(1, 0, 0),
    rotation: identity,
  };
  const bar = (
    rotation: IAutoMovieQuaternion,
  ): Parameters<typeof climbStairsRailLine>[1] => ({
    frame: { translation: p(0, 0.9, 0), rotation },
    aperture: 0.1,
    length: 2,
  });

  // 1. Unturned.
  const line: climbStairsRailLine.ILine = climbStairsRailLine(
    model,
    bar(identity),
  )!;
  TestValidator.predicate(
    "the line",
    vclose(line.center, p(1, 0.9, 0), ROUNDING) &&
      vclose(line.along, p(1, 0, 0), ROUNDING) &&
      vclose(line.normal, p(0, 1, 0), ROUNDING) &&
      Math.abs(line.end - 0.95) <= ROUNDING,
  );

  // 2. The hold.
  TestValidator.predicate(
    "the hold",
    vclose(line.point(p(1.4, 0, 3)), p(1.4, 0.9, 0), ROUNDING) &&
      vclose(line.point(p(5, 0, 0)), p(1.95, 0.9, 0), ROUNDING),
  );

  // 3. Turned by the prop.
  const turned: climbStairsRailLine.ILine = climbStairsRailLine(
    {
      position: p(1, 0, 0),
      rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
    },
    bar(identity),
  )!;
  TestValidator.predicate(
    "turned",
    vclose(turned.along, p(0, 0, -1), ROUNDING),
  );

  // 4. A post.
  TestValidator.equals(
    "a post",
    climbStairsRailLine(
      model,
      bar({ x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 }),
    ),
    null,
  );
}
