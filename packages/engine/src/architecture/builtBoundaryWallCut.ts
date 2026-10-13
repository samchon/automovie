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
 *
 * @evidence contracts/common.md#principled-implementation Takes the axis-aligned bounds of the face outline as the panel and the bounds of each profile's `outlineHull` as its void, and places the panel centre through the face's own rotation; arcs and concave outlines are over-approximated as rectangles because the wall kernel only cuts rectangles.
 * @evidence contracts/common.md#clear-and-simple-design Only joins one declared face and its openings into the kernel's input shape; cutting stays in `buildAutoMovieWall`, and refusing overlapping voids stays with the kernel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An opening without a profile is skipped rather than given an invented size, a missing boundary or face throws by name, and the rectangle approximation is stated in the documentation rather than presented as the arch.
 * @evidence contracts/common.md#meaningful-documentation States that void ids are the architectural opening ids, the rectangular-kernel limit for arched voids and concave faces, the frame void offsets are measured in, the profile-less case, and the refusals.
 * @evidence contracts/performance.md#cost-and-resources One linear search over boundaries and one filter over openings, then a hull and bounds linear in each profiled opening's points; nothing is cached and only the result record with its void list is allocated.
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
