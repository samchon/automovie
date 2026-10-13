import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieWallOpening } from "../geometry/IAutoMovieWallOpening";

/**
 * The rectangular wall panel and cut voids one boundary's own face implies.
 *
 * Produced by `builtBoundaryWallCut`. The panel is the axis-aligned bounding
 * rectangle of the face outline in the face's local XY, centred on the face
 * plane; each void is the bounding rectangle of its opening profile's convex
 * hull, measured from the panel's lower-left corner. Openings on the boundary
 * that declare no profile have no void here.
 *
 * @evidence contracts/common.md#principled-implementation Reduces the face outline and each opening profile to axis-aligned rectangles in the face's local XY with `polygonBounds` (after `outlineHull` on the profile), because the wall kernel cuts only rectangles.
 * @evidence contracts/common.md#clear-and-simple-design Each void carries its architectural opening id, so the kernel's refusal of two overlapping voids names the openings rather than an index.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rectangle approximation is the documented kernel limit: an arched void becomes its bounding rectangle and a concave face its bounding panel, and overlapping void bounds are refused by the kernel rather than merged here.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the frame of every dimension, where `origin` and `rotation` come from, that voids are bounding rectangles keyed by opening id, and that profile-less openings are absent.
 * @evidenceExclude contracts/performance.md#cost-and-resources A record whose producer does a linear boundary search plus a filter over every opening of the environment; it shares the face's rotation object and owns fresh void records, with nothing cached between a cut and a later wall build.
 * @author Samchon
 */
export interface IAutoMovieBoundaryWallCut {
  /** Panel extent along the boundary's local X, in metres. */
  width: number;

  /** Panel extent along the boundary's local Y, in metres. */
  height: number;

  /** Panel extent along local Z: the face thickness, in metres. */
  depth: number;

  /** World position of the panel's own centre, on the face plane. */
  origin: IAutoMovieVector3;

  /** World rotation of the panel, the boundary face's own rotation object. */
  rotation: IAutoMovieQuaternion;

  /** Kernel voids, each keyed by the architectural opening that declared it. */
  openings: IAutoMovieWallOpening[];
}
