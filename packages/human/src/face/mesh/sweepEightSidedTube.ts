import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { millimetrePoint as p } from "./millimetrePoint";
import { Point } from "./structures/Point";
import { triangulateSurfaceLattice as patch } from "./triangulateSurfaceLattice";

/**
 * An eight-sided swept strand in the same frame as its guiding curve.
 * The Z guide requires eyelash and eyebrow paths transverse to that axis;
 * it does not support every possible curve. Zero, nonfinite and Z-parallel tangents
 * refuse before a collapsed ring can enter the model. Width is radius, in mm.
 * Callers own positive integer rows, finite nonnegative widths, and pure
 * curve/width callbacks; the finite-difference step is a normalized parameter
 * increment, not a physical measurement or adaptive curvature guarantee.
 *
 * @evidence contracts/common.md#principled-implementation A clamped central difference at parameter offsets 0.0001 estimates each ring tangent, and a Z-guide cross product constructs its transverse frame. Nonfinite, zero and Z-parallel tangents refuse; eight equal angular sides sample the circular cross-section while caps and duplicated seam vertices remain the lattice producer's limits.
 * @evidence contracts/common.md#clear-and-simple-design One frame per longitudinal row serves all eight sides through triangulateSurfaceLattice, keeping guide evaluation separate from shared grid topology and normals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The eight-sided radial representation and normalized finite-difference step are stated approximation choices, with no anatomy-specific coordinates or fallback axis concealing an unsupported tangent. Width/resolution and actual rendered appearance remain caller-owned premises.
 * @evidence contracts/common.md#meaningful-documentation The comment states head-frame millimetres, width-as-radius, the Z-guide limitation/refusals, callback purity, finite widths/resolution, and the difference between a parameter step and anatomical accuracy.
 * @evidence contracts/performance.md#efficient-algorithms For R rows, frames take O(R) storage and three curve/one width evaluations per row; the fixed eight-column lattice and shared normals also cost O(R), plus callback costs. Computing a frame once per ring avoids repeating the same guide work for every angular sample.
 * @evidence contracts/performance.md#reuse-equivalent-work Each invocation reuses its row frames across the nine angular samples including the duplicate seam endpoint; purity permits that local reuse, with no cross-request identity cache for callbacks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Row frames live only through synchronous lattice construction and are released on return or refusal; only the resulting mesh arrays transfer, with storage growing by caller rows and no retained tasks or handles.
 */
export const sweepEightSidedTube: (curve: (t: number) => Point, width: (t: number) => number, rows: number) => IAutoMovieMesh = (
  curve: (t: number) => Point,
  width: (t: number) => number,
  rows: number,
): IAutoMovieMesh => {
  // Each ring shares one centre and tangent frame. These curves are pure;
  // recomputing that frame for every side only repeats identical work.
  const frames: { at: Point; right: Point; up: Point; radius: number }[] = Array.from({ length: rows + 1 }, (_: unknown, row: number): { at: Point; right: Point; up: Point; radius: number } => {
    const v: number = row / rows;
    const at: Point = curve(v);
    const tangent: Point = Vector3.normalize(
      Vector3.subtract(
        curve(Math.min(1, v + 0.0001)),
        curve(Math.max(0, v - 0.0001)),
      ),
    );
    if (
      ![tangent.x, tangent.y, tangent.z].every(Number.isFinite) ||
      (tangent.x === 0 && tangent.y === 0)
    )
      throw new Error(
        "Portrait strand tangents must be finite, nonzero and transverse to Z.",
      );
    const right: Point = Vector3.normalize(Vector3.cross(p(0, 0, 1), tangent)),
      up: Point = Vector3.cross(tangent, right),
      radius: number = width(v);
    return { at, right, up, radius };
  });
  return patch(
    (u: number, v: number): Point => {
      const { at, right, up, radius }: (typeof frames)[number] = frames[Math.round(v * rows)];
      return p(
        at.x +
          radius * (right.x * Math.cos(tau * u) + up.x * Math.sin(tau * u)),
        at.y +
          radius * (right.y * Math.cos(tau * u) + up.y * Math.sin(tau * u)),
        at.z +
          radius * (right.z * Math.cos(tau * u) + up.z * Math.sin(tau * u)),
      );
    },
    8,
    rows,
  );
};

/** One turn, for the eight-sided ring swept along a guide. */
const tau: number = Math.PI * 2;
