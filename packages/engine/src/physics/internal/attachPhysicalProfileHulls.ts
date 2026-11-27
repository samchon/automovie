import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
} from "@automovie/interface";

import { AutoMoviePhysicalHullFaces } from "../AutoMoviePhysicalHullFaces";

/*
 * A profile whose hull shapes each carry their hull, built once here so that
 * every later query reads it.
 * Parameter profile: A profile, possibly stored without its derived hulls.
 * Returns: A copy whose hull shapes carry a hull, the others unchanged.
 */
export function attachPhysicalProfileHulls(
  profile: IAutoMoviePhysicalProfile,
): IAutoMoviePhysicalProfile {
  return {
    ...profile,
    segments: profile.segments.map(
      (segment: IAutoMoviePhysicalSegment): IAutoMoviePhysicalSegment => ({
        ...segment,
        shapes: segment.shapes.map(
          (shape: IAutoMoviePhysicalShape): IAutoMoviePhysicalShape =>
            shape.kind === "hull" && shape.hull === undefined
              ? { ...shape, hull: AutoMoviePhysicalHullFaces.build(shape.points) }
              : shape,
        ),
      }),
    ),
  };
}
