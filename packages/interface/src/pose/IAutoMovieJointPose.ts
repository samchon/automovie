import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * The articulation of a single joint, expressed as semantic clinical angles.
 *
 * This is the **LLM-facing** rotation primitive: the one thing the model
 * actually emits to move a body. It deliberately mirrors the axis decomposition
 * of {@link IAutoMovieJointConstraint} (flexion / abduction / twist) so a
 * generated angle can be validated against the joint's ROM by a direct,
 * per-axis comparison. The engine composes these three angles, about the bone's
 * local axes and on top of its rest transform, into the quaternion the renderer
 * consumes.
 *
 * Named degree axes let an author state an elbow bend as `{ bone:
 * "leftLowerArm", flexion: 90, abduction: null, twist: null }`. All three angle
 * members are required; null explicitly leaves an axis neutral.
 *
 * Each axis is number or null; null means neutral zero. On an immobile
 * constraint axis, validateJointRom admits both null and numeric zero and
 * refuses nonzero motion. These declared numeric limits do not certify a
 * complete anatomical or dynamic outcome.
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
