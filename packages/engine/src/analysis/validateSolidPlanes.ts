import { IAutoMovieHalfSpacePlane } from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES } from "./constants/AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES";

/**
 * Check the half-spaces of one convex blocker.
 *
 * Shared by the context validator and by every adapter that accepts an authored
 * shading solid, so a neighbour's mass and the building's own canopy are held
 * to exactly the same standard.
 *
 * Violations are appended to `out` under `path` and worded with `label`;
 * resident plane slots are visited by index and missing records are refused at their slot. The plane-array and other nested vector shapes remain a caller premise; this helper does not validate arbitrary container types. The checks are a plane count of at least
 * `AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES`, finite normals longer than `1e-12`, and
 * finite offsets. Whether the planes enclose a non-empty, bounded region is not
 * checked, so four or more planes describing an unbounded or empty set pass.
 *
 * @param planes Half-spaces whose intersection is the solid; a point is inside
 *   one when `dot(normal, point) <= offset`.
 * @param path Violation path of the plane array, such as
 *   `$input.occluders[0].planes`.
 * @param label Kind of solid named in every message, such as `occluder`.
 * @param out Caller-owned sink the violations are appended to.
 *
 * @evidence contracts/common.md#principled-implementation Compares the plane count with four, the fewest half-spaces that can bound a 3D region, then visits each index, refusing an absent record before checking its normal through `ViolationCollector.direction` and offset for finiteness; boundedness and non-emptiness of the intersection remain unchecked.
 * @evidence contracts/common.md#clear-and-simple-design One function holds the per-plane rule and writes into the caller's collector, so the context validator accumulates every violation while `assertAutoMovieAnalysisSolids` converts the same violations into a throw; the direction rule itself belongs to the collector shared with other validators.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No plane, label or caller is special-cased; the count floor is the named constant `AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES`, and nothing downstream compensates for an unbounded solid, which simply blocks wherever its half-spaces say.
 * @evidence contracts/common.md#meaningful-documentation Names both callers, resident-slot/count/normal/offset checks, the 1e-12 length floor, typed nested-container premise, accumulating sink, inside convention and unchecked empty/unbounded intersections.
 * @evidence contracts/performance.md#efficient-algorithms One O(P) pass performs fixed scalar/vector checks per plane with constant live scratch, plus path/diagnostic text proportional to its length. No pairwise plane or enclosure solve proves boundedness; only caller-owned findings accumulate.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure check of one plane list per call; each caller passes a different solid, and no verdict exists to share between calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing and opens no handle; the violations go into the caller-owned collector, whose lifetime the caller controls.
 */
export const validateSolidPlanes: (
  planes: readonly IAutoMovieHalfSpacePlane[],
  path: string,
  label: string,
  out: ViolationCollector,
) => void = (
  planes: readonly IAutoMovieHalfSpacePlane[],
  path: string,
  label: string,
  out: ViolationCollector,
): void => {
  if (planes.length < AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES)
    out.push(
      "range",
      path,
      `a convex ${label} needs at least ${AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES} half-spaces to bound a solid, but had ${planes.length}`,
      planes.length,
    );
  for (let index: number = 0; index < planes.length; ++index) {
    const plane: IAutoMovieHalfSpacePlane | undefined = planes[index];
    const slotPath: string = `${path}[${index}]`;
    if (plane === undefined) {
      out.push(
        "type",
        slotPath,
        "a resident plane slot must contain its declared record",
        plane,
      );
      continue;
    }
    out.direction(
      `${path}[${index}].normal`,
      plane.normal,
      `${label} plane normal`,
    );
    if (!Number.isFinite(plane.offset))
      out.push(
        "range",
        `${path}[${index}].offset`,
        `${label} plane offset must be finite, but was ${plane.offset}`,
        plane.offset,
      );
  }
};
