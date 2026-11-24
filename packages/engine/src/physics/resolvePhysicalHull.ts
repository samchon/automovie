import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMovieVector3,
} from "@automovie/interface";

import { physicalHullFaces } from "./physicalHullFaces";

/**
 * The hull a hull query reads: the hull a shape record already carries, or the
 * hull of a bare point set computed directly.
 *
 * @param source A hull built with its shape, or shape-local points in metres.
 * @returns The hull itself when given one, otherwise the faces of the points.
 */
export function resolvePhysicalHull(
  source: readonly IAutoMovieVector3[] | IAutoMoviePhysicalHullFaces.IHull,
): IAutoMoviePhysicalHullFaces.IHull {
  return "faces" in source ? source : physicalHullFaces(source);
}
