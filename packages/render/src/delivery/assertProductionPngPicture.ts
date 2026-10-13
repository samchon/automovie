import type { IAutoMovieProductionPngPicture } from "@automovie/interface";

import type { IAutoMovieProductionPngProfile } from "./IAutoMovieProductionPngProfile";

/**
 * Refuse every difference between a role's PNG profile and the facts a PNG
 * parser observed.
 *
 * Raster, bit depth, channel layout, alpha, interlace, color space and
 * orientation must equal the profile, and a declared physical pixel ratio must
 * be square; an absent ratio counts as square. The first difference, in that
 * order, throws an `Error` naming the role, the field, and the expected and
 * observed values.
 *
 * @evidence contracts/common.md#principled-implementation Every compared field is a scalar compared by identity against the profile, and pixel aspect is judged by the ratio itself, `x === y`, because a PNG may declare square pixels with any equal pair of densities.
 * @evidence contracts/common.md#clear-and-simple-design One ordered list of named comparisons is the whole check, so the error names the first failing field; the profile's raster rules stay in `resolveProductionPngProfile`, which built it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The profile's `version` and `role` are not picture facts and are not compared, and no role relaxes a field.
 * @evidence contracts/common.md#meaningful-documentation The doc lists the compared fields, the pixel-aspect rule with its absent case, the order that decides the reported field, and the error contents.
 * @evidence contracts/performance.md#efficient-algorithms The check compares a fixed set of eight or nine scalars in constant time, independent of the picture size, because the parser has already decoded the facts.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call judges one parsed picture against one profile, and different delivered PNGs are not equivalent work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the small comparison list exists during the call, and the function opens no file or task.
 */
export const assertProductionPngPicture = (props: {
  /** Profile of the role the PNG was written for. */
  profile: IAutoMovieProductionPngProfile;

  /** Facts the PNG parser observed in the delivered file. */
  actual: IAutoMovieProductionPngPicture;
}): void => {
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
