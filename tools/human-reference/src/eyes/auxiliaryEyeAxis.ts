import type { V3 } from "../geometry/V3.ts";
import { add } from "../geometry/add.ts";
import { len } from "../geometry/len.ts";
import { mul } from "../geometry/mul.ts";
import { norm } from "../geometry/norm.ts";
import { sub } from "../geometry/sub.ts";
import type { AuxiliarySurface } from "../headneck/AuxiliarySurface.ts";

/**
 * Defines a reproducible auxiliary-globe axis from its anterior protrusion.
 * The forward hemisphere uses the declared source +Z. Averaging its farthest
 * one percent is a source-classification convention, not a measured optical axis.
 *
 * @evidence contracts/common.md#principled-implementation Measures each component vertex relative to its own bounds centre and averages the forward radial extreme to suppress one-vertex sampling dependence.
 * @evidence contracts/common.md#clear-and-simple-design Returns the centre, axis and protrusion point consumed by every eye observation frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no source indices or identity-specific axis and does not name the result a clinical optical axis.
 * @evidence contracts/common.md#meaningful-documentation States the declared forward direction, averaging rule and conventional geometric meaning.
 * @evidence contracts/performance.md#efficient-algorithms Scans n vertices and sorts the forward candidates in O(n log n) time with O(n) temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned frame definition is shared by aperture and radial observations within one eye extraction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Candidate arrays are local and released on return; no external resources are acquired.
 */
export function auxiliaryEyeAxis(eye: AuxiliarySurface): {
  c: V3;
  a: V3;
  apex: V3;
} {
  const candidates: { point: V3; radius: number }[] = eye.vertices
    .map((point: V3): { point: V3; radius: number } => ({
      point,
      radius: len(sub(point, eye.centre)),
    }))
    .filter(
      (entry: { point: V3; radius: number }): boolean =>
        sub(entry.point, eye.centre)[2] > 0.5 * entry.radius,
    );
  if (!candidates.length)
    throw new Error("Auxiliary globe has no forward protrusion observations");
  candidates.sort(
    (
      a: { point: V3; radius: number },
      b: { point: V3; radius: number },
    ): number => b.radius - a.radius,
  );
  const count: number = Math.min(
    candidates.length,
    Math.max(5, Math.floor(candidates.length * 0.01)),
  );
  let sum: V3 = [0, 0, 0];
  for (let index: number = 0; index < count; index++)
    sum = add(sum, candidates[index].point);
  const apex: V3 = mul(sum, 1 / count);
  return { c: eye.centre, a: norm(sub(apex, eye.centre)), apex };
}
