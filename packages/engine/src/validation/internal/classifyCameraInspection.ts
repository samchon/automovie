import type { IAutoMovieCameraInspection } from "@automovie/interface";

/*
 * Grades one active requirement against delivery framing and occlusion
 * evidence.
 */
export function classifyCameraInspection(
  input: IAutoMovieCameraInspection,
): IAutoMovieCameraInspection.IResult {
  const { framing, pixels, witnesses, maxOcclusionRatio } = input;
  if (
    framing === "outside" ||
    framing === "before-near" ||
    framing === "past-far"
  )
    return { framing, occlusion: { status: "not-applicable" } };

  if (
    pixels !== undefined &&
    pixels.visible >= 0 &&
    pixels.visible <= pixels.isolated
  ) {
    if (pixels.isolated === 0)
      return { framing, occlusion: { status: "no-target-pixels" } };
    const ratio: number = (pixels.isolated - pixels.visible) / pixels.isolated;
    const status: "measured" | "within-limit" | "above-limit" =
      maxOcclusionRatio === undefined ||
      maxOcclusionRatio < 0 ||
      maxOcclusionRatio > 1
        ? "measured"
        : ratio > maxOcclusionRatio
          ? "above-limit"
          : "within-limit";
    return { framing, occlusion: { status, pixels, ratio } };
  }

  return {
    framing,
    occlusion:
      witnesses !== undefined && (witnesses.blocked > 0 || witnesses.clear > 0)
        ? { status: "witnesses", samples: witnesses }
        : { status: "unmeasured" },
  };
}
