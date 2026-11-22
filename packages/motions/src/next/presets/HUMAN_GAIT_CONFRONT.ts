import type { IAutoMovieMotionHumanGait } from "@automovie/interface";

/**
 * The confront preset: step up in front of the person (`from: "front"`) face
 * to face (`at: "faceToFace"`, `HumanProxemics.GAPS`), as a confrontation
 * begins. Spread into `approach`'s parameters with the person; the
 * `confront` row of `HumanPursuit` fixes these values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the side and distance the preset fixes with their results, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The approach's own side and band as one `IFacingApproachPreset`, so it fits any body as the approach does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGait.CONFRONT`; the confront row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GAIT_CONFRONT: IAutoMovieMotionHumanGait.IFacingApproachPreset =
  {
    from: "front",
    at: "faceToFace",
  };
