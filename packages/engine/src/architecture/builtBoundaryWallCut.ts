import { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieBoundaryWallCut } from "./IAutoMovieBoundaryWallCut";
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
 * The kernel is rectangular, and that shows in two places rather than being
 * hidden. An arched or round void is handed over as the rectangle that exactly
 * bounds it, so an author who needs the arch's own spandrel back composes it
 * from the profile rather than being told the rectangle was the arch. A concave
 * face likewise becomes its own bounding panel. Two voids that clear each other
 * as outlines may therefore still have overlapping bounds, and the kernel
 * refuses that pair by name; that refusal is the rectangle's limit speaking,
 * not a defect in the design it was handed.
 *
 * Void positions are measured from the panel's lower-left corner in the face's
 * own planar frame, and an opening without a profile contributes no void.
 * Throws when the boundary does not exist or declares no face.
 */
export const builtBoundaryWallCut = (
  environment: IAutoMovieBuiltEnvironment,
  boundaryId: string,
): IAutoMovieBoundaryWallCut => {
  const boundary = environment.boundaries.find(
    (candidate) => candidate.id === boundaryId,
  );
  if (boundary === undefined)
    throw new Error(
      `built environment "${environment.id}" has no boundary "${boundaryId}"`,
    );
  const face = boundary.face;
  if (face === undefined)
    throw new Error(
      `boundary "${boundaryId}" of built environment "${environment.id}" declares no face to cut`,
    );
  const bounds = polygonBounds(face.outline);
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
    openings: environment.openings
      .filter(
        (opening) =>
          opening.boundary === boundaryId && opening.profile !== undefined,
      )
      .map((opening) => {
        const void_ = polygonBounds(outlineHull(opening.profile!));
        return {
          id: opening.id,
          x: void_.min.x - bounds.min.x,
          y: void_.min.y - bounds.min.y,
          width: void_.max.x - void_.min.x,
          height: void_.max.y - void_.min.y,
        };
      }),
  };
};
