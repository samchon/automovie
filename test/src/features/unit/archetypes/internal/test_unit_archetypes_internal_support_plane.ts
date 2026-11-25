import type { IAutoMovieVector3 } from "@automovie/interface";
import { solveQuadrupedSupportPlane } from "@automovie/archetypes/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `solveQuadrupedSupportPlane` solves a limb in the plane through the root and
 * the lateral ankle: the planar solver is given the root, the ankle's depth
 * below the in-plane span and the ankle's z, and each solved point is mapped
 * back along the span by its drop fraction, the last being the ankle itself.
 *
 * Scenarios:
 *
 * 1. Root (0, 2, 0) and ankle (1, 0, 0.5) have span sqrt 5. The planar target is
 *    (0, 2 - sqrt 5, 0.5). Solved points at drop 0 and half the span map to
 *    (0, 2, z) and (0.5, 1, z), and the last is the ankle.
 * 2. A root at the ankle is refused.
 */
export function test_unit_archetypes_internal_support_plane(): void {
  const root: IAutoMovieVector3 = { x: 0, y: 2, z: 0 };
  const ankle: IAutoMovieVector3 = { x: 1, y: 0, z: 0.5 };
  const span: number = Math.sqrt(5);
  let target: IAutoMovieVector3 | null = null;
  const solved = solveQuadrupedSupportPlane(
    root,
    ankle,
    (planar: IAutoMovieVector3): IAutoMovieVector3[] => {
      target = planar;
      return [
        { x: 0, y: 2, z: 7 },
        { x: 0, y: 2 - span / 2, z: 8 },
        { x: 0, y: 2 - span, z: 9 },
      ];
    },
  );
  TestValidator.predicate(
    "the planar target",
    target !== null &&
      nclose((target as IAutoMovieVector3).y, 2 - span, 1e-12) &&
      (target as IAutoMovieVector3).z === 0.5,
  );
  TestValidator.predicate(
    "the mapped points",
    nclose(solved[0]!.x, 0, 1e-12) &&
      nclose(solved[0]!.y, 2, 1e-12) &&
      solved[0]!.z === 7 &&
      nclose(solved[1]!.x, 0.5, 1e-12) &&
      nclose(solved[1]!.y, 1, 1e-12) &&
      solved[1]!.z === 8,
  );
  TestValidator.equals("the ankle", solved[2], ankle);
  TestValidator.error("a degenerate plane", (): unknown =>
    solveQuadrupedSupportPlane(root, root, (): IAutoMovieVector3[] => []),
  );
}
