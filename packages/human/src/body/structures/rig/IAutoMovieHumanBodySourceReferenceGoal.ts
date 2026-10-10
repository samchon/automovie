import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * A basis joint's opt-in declaration that its thigh accepts source-reference
 * orientation goals.
 *
 * The reference's rest-to-current rigid travel carries the thigh's shaped
 * rest orientation, then its existing Euler axes, signs and neutral apply.
 * Admission requires an independent reference and pose-independent rig
 * landmarks. This registration is a source rig, not individual clinical
 * anatomy; correctives and pelvic coordination keep converted raw degrees.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceReferenceGoal {
  /** Existing source bone whose rest/current orientation defines travel. */
  reference: AutoMovieHumanoidBone;

  /** Source articulation in the reference-transported thigh rest frame. */
  coordinates: "reference-rest-euler";

  /** No personal anatomical frame or clinical capacity is certified. */
  qualification: "source-rig-only";

  /** Preserves the published corrective and coordination input convention. */
  rhythmDriver: "converted-source-pose";
}
