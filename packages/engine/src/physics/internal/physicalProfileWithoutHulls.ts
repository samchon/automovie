import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
} from "@automovie/interface";

/*
 * A profile as authored: the hull a hull shape carries is derived from its
 * points, so it takes no part in a digest or a comparison of inputs.
 * Parameter profile: The profile, its hull shapes possibly carrying their hulls.
 * Returns: A copy whose hull shapes carry points only.
 */
export function physicalProfileWithoutHulls(
  profile: IAutoMoviePhysicalProfile,
): IAutoMoviePhysicalProfile {
  return {
    ...profile,
    segments: profile.segments.map(
      (segment: IAutoMoviePhysicalSegment): IAutoMoviePhysicalSegment => ({
        ...segment,
        shapes: segment.shapes.map(
          (shape: IAutoMoviePhysicalShape): IAutoMoviePhysicalShape => {
            if (shape.kind !== "hull") return shape;
            const { hull: _derived, ...authored } = shape;
            return authored;
          },
        ),
      }),
    ),
  };
}
