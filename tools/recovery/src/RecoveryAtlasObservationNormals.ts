import type { IAutoMovieCurve64 as C } from "../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";
import type { RecoveryAtlasObservationTypes } from "./RecoveryAtlasObservationTypes.ts";

/**
 * Compute the original unnormalized source face cross products in index order.
 *
 * @evidence contracts/common.md#principled-implementation Each face uses (b-a) cross (c-a), retaining the original subtraction and multiplication order and source orientation.
 * @evidence contracts/common.md#clear-and-simple-design The caller admits the source and owns this one face-normal array for all selected interval observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No normalization, tolerance, winding correction, aliasing or source geometry substitution is introduced.
 * @evidence contracts/common.md#meaningful-documentation States the unnormalized source-normal convention, index order and ownership.
 * @evidence contracts/performance.md#efficient-algorithms One pass over F triangular faces performs constant work per face and allocates F three-component arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller computes this array once and reuses it in every selected component's crease classification.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The observation call owns O(F) private normal storage; it is not published as engine geometry and is released with that call.
 */
export function RecoveryAtlasObservationNormals(
  input: RecoveryAtlasObservationTypes["Input"],
): number[][] {
  return input.triangles.map(
    (triangle: readonly [number, number, number]): number[] => {
      const a: C.Vector = input.verticesMm[triangle[0]]!,
        b: C.Vector = input.verticesMm[triangle[1]]!,
        c: C.Vector = input.verticesMm[triangle[2]]!;
      const u: number[] = b.map((x: number, k: number): number => x - a[k]!),
        v: number[] = c.map((x: number, k: number): number => x - a[k]!);
      return [
        u[1]! * v[2]! - u[2]! * v[1]!,
        u[2]! * v[0]! - u[0]! * v[2]!,
        u[0]! * v[1]! - u[1]! * v[0]!,
      ];
    },
  );
}
