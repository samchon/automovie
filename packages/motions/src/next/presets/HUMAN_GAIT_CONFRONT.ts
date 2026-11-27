import type { IAutoMovieMotionHumanGait } from "@automovie/interface";

/*
 * The confront preset: step up in front of the person (`from: "front"`) face to
 * face (`at: "faceToFace"`, `HumanProxemics.GAPS`), as a confrontation begins.
 * Spread into `approach`'s parameters with the person; the `confront` row of
 * `HumanPursuit` fixes these values.
 */
export const HUMAN_GAIT_CONFRONT: IAutoMovieMotionHumanGait.IFacingApproachPreset =
  {
    from: "front",
    at: "faceToFace",
  };
