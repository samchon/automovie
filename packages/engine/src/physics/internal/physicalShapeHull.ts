import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalShape,
} from "@automovie/interface";

import { AutoMovieEnginePhysicalHullFaces } from "../AutoMovieEnginePhysicalHullFaces";

/*
 * The hull of a convex-hull shape: the one built with its record, or, for a
 * record that carries none, the faces of its points computed directly.
 * Parameter shape: A shape of kind `hull`.
 * Returns: Its faces, vertices and bounding radii.
 */
export function physicalShapeHull(
  shape: Extract<IAutoMoviePhysicalShape, { kind: "hull" }>,
): IAutoMoviePhysicalHullFaces.IHull {
  return shape.hull ?? AutoMovieEnginePhysicalHullFaces.build(shape.points);
}
