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
 * @evidence contracts/common.md#principled-implementation A declared independent reference transports the thigh rest orientation before its existing Euler coordinates apply.
 * @evidence contracts/common.md#clear-and-simple-design Closed coordinate, qualification and rhythm-driver fields make source-reference semantics explicit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source-rig-only qualification does not certify personal anatomical frames or motion capacity.
 * @evidence contracts/common.md#meaningful-documentation The prose states transport order, independent-reference admission and converted-pose coordination.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The reference goal registration has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The reference goal registration schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The reference goal registration declaration allocates no runtime state or handles.
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
