import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Projection of one existing public clinical pose coordinate into the source graph.
 *
 * @evidence contracts/common.md#principled-implementation Existing humanoid bone and clinical flexion/abduction/twist coordinates drive registered source motion with a neutral measured in degrees.
 * @evidence contracts/common.md#clear-and-simple-design The public-pose discriminator reuses the existing clinical conversion authority rather than defining a parallel set of pose conventions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Humanoid goal identities remain distinct from anatomical bone IDs; unit differences require a recorded source profile.
 * @evidence contracts/common.md#meaningful-documentation The comments explain original clinical authority, signed coordinates, omission neutral and the source mapping requirement for other units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Public-pose driver fields select existing clinical coordinates without implementing their quaternion conversion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The clinical driver record stores no completed pose or equivalent-request sharing key.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Degree values and humanoid identifiers retain no conversion workspace or foreign handle.
 * @author Samchon
 */
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
