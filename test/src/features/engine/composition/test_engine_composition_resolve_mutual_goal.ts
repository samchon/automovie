import { AutoMovieEngineCompositionPose } from "@automovie/engine";
import type {
  IAutoMovieResolveMutualGoal,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** Shoulder height of both people, metres. */
const SHOULDER: number = 1.5;

/**
 * `resolveMutualGoal` finds where two hands meet. Without a preferred
 * height it is the lowest point of the circle where both comfortable-reach
 * spheres meet, both reaches scaled alike when they do not; with one it is the
 * point along the shoulder line where both arms are the same share of their
 * reaches, at that height clamped into the band both straight arms reach.
 *
 * Both people have a 0.6 m comfortable reach and a 0.8 m limit, shoulders at
 * 1.5 m, the second on +X at the given gap.
 *
 * Scenarios:
 *
 * 1. 1 m apart, the spheres meet on the circle at x = 0.5, radius sqrt(0.36 -
 *    0.25) = sqrt(0.11); its lowest point is (0.5, 1.5 - sqrt(0.11), 0), 0.6 m
 *    from each shoulder.
 * 2. 1.5 m apart, both reaches scale by 1.5 / 1.2 = 1.25 to 0.75 m, within the
 *    limit's 4/3, and the spheres touch at the midpoint (0.75, 1.5, 0).
 * 3. 2 m apart needs 5/3 > 4/3: refused, naming the 1.6 m the limits close.
 * 4. 1 m apart preferring 1.2 m: by symmetry the arms share at the midpoint, and
 *    1.2 m lies inside the band 1.5 ± sqrt(0.64 - 0.25), so the point is (0.5,
 *    1.2, 0); preferring 0.5 m clamps to the band's floor.
 * 5. 2 m apart preferring 1.5 m: no point lies within both limits, refused at the
 *    1.6 m the straight arms span.
 * 6. A zero reach, a reach past the limit and coincident shoulders are refused.
 */
export function test_engine_composition_resolve_mutual_goal(): void {
  const side = (
    x: number,
    reach: number = 0.6,
    limit: number = 0.8,
  ): IAutoMovieResolveMutualGoal.ISide => ({
    shoulder: { x, y: SHOULDER, z: 0 },
    reach,
    limit,
  });
  const goal = (
    gap: number,
    height?: number,
  ): IAutoMovieResolveMutualGoal.IGoal =>
    AutoMovieEngineCompositionPose.mutualGoal({
      a: side(0),
      b: side(gap),
      ...(height === undefined ? {} : { height }),
    });
  const at = (
    result: IAutoMovieResolveMutualGoal.IGoal,
    point: IAutoMovieVector3,
    distance: number,
  ): boolean =>
    vclose(result.point, point, 1e-12) &&
    nclose(result.distance[0], distance, 1e-12) &&
    nclose(result.distance[1], distance, 1e-12);

  TestValidator.predicate(
    "intersecting spheres meet at their circle's lowest point",
    at(goal(1), { x: 0.5, y: SHOULDER - Math.sqrt(0.11), z: 0 }, 0.6),
  );
  TestValidator.predicate(
    "apart spheres scale alike until they touch",
    at(goal(1.5), { x: 0.75, y: SHOULDER, z: 0 }, 0.75),
  );
  TestValidator.predicate(
    "beyond both limits is refused with the closable gap",
    throwsError((): unknown => goal(2), ["gap of 2.000 m", "about 1.600 m"]),
  );

  const band: number = Math.sqrt(0.64 - 0.25);
  TestValidator.predicate(
    "a preferred height inside the band is kept at the shared share",
    vclose(goal(1, 1.2).point, { x: 0.5, y: 1.2, z: 0 }, 1e-12),
  );
  TestValidator.predicate(
    "a preferred height below the band clamps to its floor",
    vclose(goal(1, 0.5).point, { x: 0.5, y: SHOULDER - band, z: 0 }, 1e-12),
  );
  TestValidator.predicate(
    "no shared band is refused at the straight arms' span",
    throwsError((): unknown => goal(2, SHOULDER), ["about 1.600 m"]),
  );

  TestValidator.predicate(
    "malformed sides are refused",
    throwsError(
      (): unknown => AutoMovieEngineCompositionPose.mutualGoal({ a: side(0, 0), b: side(1) }),
      "0 < reach <= limit",
    ) &&
      throwsError(
        (): unknown =>
          AutoMovieEngineCompositionPose.mutualGoal({ a: side(0, 0.9), b: side(1) }),
        "0 < reach <= limit",
      ) &&
      throwsError(
        (): unknown => AutoMovieEngineCompositionPose.mutualGoal({ a: side(0), b: side(0) }),
        "different places",
      ),
  );
}
