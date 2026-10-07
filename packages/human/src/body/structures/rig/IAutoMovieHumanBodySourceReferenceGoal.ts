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
 * @evidence contracts/common.md#principled-implementation Names the reference bone and fixes each convention as a literal the converter checks.
 * @evidence contracts/common.md#clear-and-simple-design Four literal-bound fields replace an anonymous property type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clinical frame, capacity or hand-copied angle stands in for the declaration.
 * @evidence contracts/common.md#meaningful-documentation States the transport, admission and qualification of the declaration.
 * @evidence contracts/modeling.md#spatial-conventions Goals are Euler degrees in the reference-transported thigh rest frame.
 * @evidence contracts/modeling.md#parameter-channels Converted goals drive the existing corrective and coordination inputs as source pose.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Defines no tissue boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The builder and editor observe the performed goal.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Qualifies a source rig, not a measured individual.
 * @evidenceExclude contracts/anatomy.md#permitted-range The joint's range remains the authoring envelope.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The document's thigh goals are the caller's control.
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
