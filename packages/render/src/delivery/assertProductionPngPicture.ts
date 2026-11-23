import type {
  IAutoMovieAssertProductionPngPictureProps,
  IAutoMovieProductionPngPicture,
  IAutoMovieProductionPngProfile,
} from "@automovie/interface";

/**
 * Refuse every difference between a role's PNG profile and the facts a PNG
 * parser observed.
 *
 * Raster, bit depth, channel layout, alpha, interlace, color space and
 * orientation must equal the profile, and a declared physical pixel ratio must
 * be square; an absent ratio counts as square. The first difference, in that
 * order, throws an `Error` naming the role, the field, and the expected and
 * observed values.
 */
export const assertProductionPngPicture: (
  props: IAutoMovieAssertProductionPngPictureProps,
) => void = (props: IAutoMovieAssertProductionPngPictureProps): void => {
  const expected: IAutoMovieProductionPngProfile = props.profile;
  const actual: IAutoMovieProductionPngPicture = props.actual;
  const entries: Array<[string, unknown, unknown]> = [
    ["width", expected.width, actual.width],
    ["height", expected.height, actual.height],
    ["bitDepth", expected.bitDepth, actual.bitDepth],
    ["color", expected.color, actual.color],
    ["alpha", expected.alpha, actual.alpha],
    ["interlace", expected.interlace, actual.interlace],
    ["colorSpace", expected.colorSpace, actual.colorSpace],
    ["orientation", expected.orientation, actual.orientation],
  ];
  if (
    actual.pixelAspect.kind === "explicit" &&
    actual.pixelAspect.x !== actual.pixelAspect.y
  )
    entries.push([
      "pixelAspect",
      expected.pixelAspect,
      `${actual.pixelAspect.x}:${actual.pixelAspect.y}`,
    ]);
  const mismatch: [string, unknown, unknown] | undefined = entries.find(
    ([, wanted, observed]: [string, unknown, unknown]): boolean =>
      wanted !== observed,
  );
  if (mismatch !== undefined)
    throw new Error(
      `PNG ${expected.role} profile mismatch at ${mismatch[0]}: expected ${String(mismatch[1])}, observed ${String(mismatch[2])}.`,
    );
};
