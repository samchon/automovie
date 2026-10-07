import type { AutoMovieHumanoidBone } from "@automovie/interface";

/** Projection of one existing public clinical pose coordinate into the source graph. */
export interface IAutoMovieHumanBodySourcePoseDriver {
  /** Existing canonical public pose coordinate, with its original clinical conversion authority. */
  kind: "public-pose";

  /** Existing humanoid goal identity, not an additional anatomical bone name. */
  bone: AutoMovieHumanoidBone;

  /** Existing signed public angular coordinate. */
  axis: "flexion" | "abduction" | "twist";

  /** Source's public rest coordinate used when the caller omits this goal. */
  neutral: number;

  /** Existing public clinical angular coordinate, degrees; any different source unit requires a recorded profile. */
  unit: "degrees";
}
