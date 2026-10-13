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
 * nothing is thrown. The checks are a plane count of at least
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
 * @evidence contracts/common.md#principled-implementation Compares the plane count with four, the fewest half-spaces that can bound a 3D region, and checks each normal through `ViolationCollector.direction` and each offset for finiteness; boundedness and non-emptiness of the intersection would need a pairwise or linear-programming test and remain unchecked, which the documentation states.
 * @evidence contracts/common.md#clear-and-simple-design One function holds the per-plane rule and writes into the caller's collector, so the context validator accumulates every violation while `assertAutoMovieAnalysisSolids` converts the same violations into a throw; the direction rule itself belongs to the collector shared with other validators.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No plane, label or caller is special-cased; the count floor is the named constant `AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES`, and nothing downstream compensates for an unbounded solid, which simply blocks wherever its half-spaces say.
 * @evidence contracts/common.md#meaningful-documentation The documentation names both callers, the three checks, the `1e-12` length floor, the no-throw sink behavior, the inside convention of a plane, and that empty or unbounded sets pass.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the P planes with constant work each, so time is O(P) and no memory is allocated beyond the violations; no pairwise plane test runs, which is also why boundedness goes unchecked.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure check of one plane list per call; each caller passes a different solid, and no verdict exists to share between calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing and opens no handle; the violations go into the caller-owned collector, whose lifetime the caller controls.
 * @author Samchon
 */
export const validateSolidPlanes = (
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
  planes.forEach((plane: IAutoMovieHalfSpacePlane, index: number): void => {
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
  });
};
