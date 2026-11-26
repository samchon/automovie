import {
  type IAutoMovieBoundaryWallCut,
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltEnvironment,
  IAutoMoviePlanarPoint,
  type IAutoMovieWallOpening,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { outlineHull } from "./outlineHull";
import { polygonBounds } from "./polygonBounds";

/**
 * Turn one boundary's declared face into the wall panel a mesh kernel can cut.
 *
 * This is the join that stops the declared opening and the modelled hole from
 * being two unrelated facts: the returned voids carry the architectural
 * opening's own id, so `buildAutoMovieWall` cuts the wall against the same
 * records validation held inside the face.
 *
 * The rectangular kernel receives the bounds of the shared straight
 * arc-envelope ring, which can overstate an arched opening's profile-axis
 * extent. A concave face likewise becomes its bounding panel. Distinct void
 * outlines can therefore have overlapping rectangle proxies that the kernel
 * refuses by name; callers needing curved cuts must compose the profile
 * geometry separately.
 *
 * Void positions are measured in metres from the panel's lower-left corner in
 * the face's own planar frame, voids follow record order, and an opening
 * without a profile contributes no void. Throws when the boundary does not
 * exist or declares no face.
 */
export function builtBoundaryWallCut(
  environment: IAutoMovieBuiltEnvironment,
  boundaryId: string,
): IAutoMovieBoundaryWallCut {
  const boundary: IAutoMovieBuiltBoundary | undefined =
    environment.boundaries.find(
      (candidate: IAutoMovieBuiltBoundary): boolean =>
        candidate.id === boundaryId,
    );
  if (boundary === undefined)
    throw new Error(
      `built environment "${environment.id}" has no boundary "${boundaryId}"`,
    );
  const face: IAutoMovieBuiltBoundary["face"] = boundary.face;
  if (face === undefined)
    throw new Error(
      `boundary "${boundaryId}" of built environment "${environment.id}" declares no face to cut`,
    );
  const bounds: { min: IAutoMoviePlanarPoint; max: IAutoMoviePlanarPoint } =
    polygonBounds(face.outline);
  const openings: IAutoMovieWallOpening[] = [];
  for (const opening of environment.openings) {
    if (opening.boundary !== boundaryId || opening.profile === undefined)
      continue;
    const hole: { min: IAutoMoviePlanarPoint; max: IAutoMoviePlanarPoint } =
      polygonBounds(outlineHull(opening.profile));
    openings.push({
      id: opening.id,
      x: hole.min.x - bounds.min.x,
      y: hole.min.y - bounds.min.y,
      width: hole.max.x - hole.min.x,
      height: hole.max.y - hole.min.y,
    });
  }
  return {
    width: bounds.max.x - bounds.min.x,
    height: bounds.max.y - bounds.min.y,
    depth: face.thickness,
    origin: Vector3.add(
      face.origin,
      Quaternion.rotateVector(face.rotation, {
        x: (bounds.min.x + bounds.max.x) / 2,
        y: (bounds.min.y + bounds.max.y) / 2,
        z: 0,
      }),
    ),
    rotation: face.rotation,
    openings,
  };
}
