import type { IAutoMovieCameraInspection } from "@automovie/interface";

/**
 * Grades one active requirement against delivery framing and occlusion evidence.
 *
 * @evidence contracts/development/implementation.md#principled-implementation
 * Only compatible safe-integer pixel counts enter the fraction comparison. The
 * inclusive threshold is applied to the fraction of isolated pixels hidden in
 * the matched composite; zero isolated pixels have no defined fraction.
 * @evidence contracts/development/implementation.md#efficient-algorithms
 * Classification is constant work per requirement and does not traverse or
 * render the scene.
 * @evidence contracts/development/common.md#meaningful-documentation Separates
 * definite out-of-frame, bounded ray evidence and measured occlusion.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three ordered branches: definite exclusion, compatible pixel counts, then ray witnesses or unmeasured.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Incompatible counts, zero isolated pixels and an invalid limit are reported as such instead of graded.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A constant-time grade of one requirement.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh result and keeps nothing.
 */
export function classifyAutoMovieCameraInspection(
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
    Number.isSafeInteger(pixels.isolated) &&
    Number.isSafeInteger(pixels.visible) &&
    pixels.visible >= 0 &&
    pixels.visible <= pixels.isolated
  ) {
    if (pixels.isolated === 0)
      return { framing, occlusion: { status: "no-target-pixels" } };
    const ratio: number = (pixels.isolated - pixels.visible) / pixels.isolated;
    const status: "measured" | "within-limit" | "above-limit" =
      maxOcclusionRatio === undefined ||
      !Number.isFinite(maxOcclusionRatio) ||
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
