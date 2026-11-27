import type {
  IAutoMoviePhysicalHullMass,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMoviePhysicalHullFaces } from "../AutoMoviePhysicalHullFaces";
import { physicalHullFacesMass } from "./physicalHullFacesMass";

/**
 * The volume, centroid and principal inertia of the uniform solid convex hull
 * of a point set, searching its hull afresh (see `physicalHullFacesMass`).
 *
 * @param points Shape-local points, metres, spanning a volume.
 * @returns The volume in cubic metres, the centroid in the points' frame, and
 *   the principal moments per unit mass (square metres, ascending) with the
 *   rotation from the principal frame to the points' frame.
 * @throws {Error} When the points span no volume.
 */
export function physicalHullMass(
  points: readonly IAutoMovieVector3[],
): IAutoMoviePhysicalHullMass.IResult {
  return physicalHullFacesMass(AutoMoviePhysicalHullFaces.build(points));
}
