import {
  IAutoMovieHalfSpacePlane,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { AutoMovieEngineAnalysisMinSolidPlanes } from "../AutoMovieEngineAnalysisMinSolidPlanes";

/*
 * Check the half-spaces of one convex blocker.
 *
 * Shared by the context validator and by every adapter that accepts an authored
 * shading solid, so a neighbour's mass and the building's own canopy are held
 * to exactly the same standard.
 *
 * Violations are appended to `out` under `path` and worded with `label`;
 * resident plane slots are visited by index and missing records are refused at
 * their slot. The plane-array and other nested vector shapes remain a caller
 * premise; this helper does not validate arbitrary container types. The checks
 * are a plane count of at least `AutoMovieEngineAnalysisMinSolidPlanes`, finite
 * normals longer than `1e-12`, and finite offsets. Whether the planes enclose a
 * non-empty, bounded region is not checked, so four or more planes describing
 * an unbounded or empty set pass.
 * Parameter planes: Half-spaces whose intersection is the solid; a point is inside
 * one when `dot(normal, point) <= offset`.
 * Parameter path: Violation path of the plane array, such as
 * `$input.occluders[0].planes`.
 * Parameter label: Kind of solid named in every message, such as `occluder`.
 * Parameter out: Caller-owned sink the violations are appended to.
 */
export function validateSolidPlanes(
  planes: readonly IAutoMovieHalfSpacePlane[],
  path: string,
  label: string,
  out: IAutoMovieViolationCollector,
): void {
  if (planes.length < AutoMovieEngineAnalysisMinSolidPlanes)
    out.push(
      "range",
      path,
      `a convex ${label} needs at least ${AutoMovieEngineAnalysisMinSolidPlanes} half-spaces to bound a solid, but had ${planes.length}`,
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
  }
}
