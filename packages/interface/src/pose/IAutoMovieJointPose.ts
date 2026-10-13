import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * The articulation of a single joint, expressed as semantic clinical angles.
 *
 * This is the **LLM-facing** rotation primitive: the one thing the model actually emits to move a body. It deliberately mirrors the axis decomposition of {@link IAutoMovieJointConstraint} (flexion / abduction / twist) so a generated angle can be validated against the joint's ROM by a direct, per-axis comparison. The engine composes these three angles, about the bone's local axes and on top of its rest transform, into the quaternion the renderer consumes.
 *
 * Exposing degrees-per-named-axis (instead of a quaternion) is the core reason an LLM can drive a body at all: "bend the left elbow 90°" is `{ bone: "leftLowerArm", flexion: 90 }`, which the model produces reliably and a human can read.
 *
 * Each axis is `number | null`; `null` means "no rotation on this axis" (equivalent to 0, and the only valid value for an axis the joint cannot move; the ROM verifier rejects a non-null angle on a `null` constraint axis).
 *
 * @evidence contracts/common.md#principled-implementation Clinical flexion, abduction and twist match the joint constraint axes, allowing direct degree-range checks before jointToQuaternion composes rotations in the rig's declared basis; null is neutral and is required for an unavailable constraint axis.
 * @evidence contracts/common.md#clear-and-simple-design A bone identity and three nullable scalar angles expose articulation without mixing rest transforms, root movement or quaternion storage into the authored joint.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Joint limits come from the target skeleton's effective constraint rather than a named actor or pose; an angle on an unavailable axis is reported instead of silently ignored.
 * @evidence contracts/common.md#meaningful-documentation Defines clinical axis signs, degree units, composition over the rest transform and neutral-null semantics, including the restriction for immovable axes.
 * @author Samchon
 */
export interface IAutoMovieJointPose {
  /** Which bone this articulation applies to. */
  bone: AutoMovieHumanoidBone;

  /** Sagittal degrees: flexion (+), extension (-); null is neutral zero. */
  flexion: number | null;

  /** Frontal degrees: abduction (+), adduction (-); null is neutral zero. */
  abduction: number | null;

  /** Axial degrees: external (+), internal (-); null is neutral zero. */
  twist: number | null;
}
