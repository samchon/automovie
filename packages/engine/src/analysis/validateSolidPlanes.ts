import {
  IAutoMovieHalfSpacePlane,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";
import { AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES } from "./constants/AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES";

/** Directions shorter than this carry no direction at all. */
const AXIS_EPSILON = 1e-12;

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
  planes.forEach((plane, index) => {
    direction(
      plane.normal,
      `${path}[${index}].normal`,
      `${label} plane normal`,
      out,
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

const direction = (
  value: IAutoMovieVector3,
  path: string,
  label: string,
  out: ViolationCollector,
): void => {
  for (const axis of ["x", "y", "z"] as const)
    if (!Number.isFinite(value[axis]))
      out.push(
        "range",
        `${path}.${axis}`,
        `${label} ${axis} must be finite, but was ${value[axis]}`,
        value[axis],
      );
  const length = Vector3.length(value);
  if (Number.isFinite(length) && length <= AXIS_EPSILON)
    out.push("range", path, `${label} must be a non-zero direction`, value);
};
