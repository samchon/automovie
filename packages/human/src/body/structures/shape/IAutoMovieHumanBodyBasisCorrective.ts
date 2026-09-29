import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Combination correctives, evaluated after the channels that drive them, with
 * the activation `min(1, weight * product of clamped inputs)` of
 * `createHumanFaceBasisBuilder`. Two kinds of driver exist. A channel driver
 * reads a shape weight, and the first revision's macro pair residuals use
 * it: the source blends its macro targets as products of node weights, so a
 * tall child is not a scaled tall adult, and the difference is sampled and
 * published rather than approximated. A channel driver may carry its own
 * ramp over the weight, so a corrective solved at an envelope extreme past
 * the source's unit node stays off at the node, where the body it corrects
 * does not yet exist. A joint driver reads a clinical pose
 * angle as a ramp: zero until the joint has moved `onset` degrees from its
 * rest toward the named side, one from `full` degrees on, linear between.
 * That is RigLogic's conditional table applied to a joint, and it is how a
 * pose corrective (a fold pushed out, a girth restored) fires only where
 * the census found the defect and not across the whole range.
 *
 * Every corrective endpoint is a rest-space displacement applied before the
 * skin is posed, as MetaHuman applies its pose-space deformations as blend
 * shapes under the joints; the skinning then carries the correction with
 * the bone.
 * The current basis contains pose correctives that repair sampled forms, but
 * a sum of independent rest-space rows cannot enforce simultaneous bilateral
 * contact or preserve tissue volume in arbitrary deep flexion. The same
 * limitation already appears at rest when macro pair and weight-envelope
 * rows add on some valid multi-axis body shapes: each family alone can be
 * clear while their sum folds the skin. Contact is a separate posed-surface
 * constraint, not a stronger corrective gain. The connected study's
 * `pose-correctives-receipt.json` records the sampled
 * production of its rows and the revision on which they were solved.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisCorrective {
  /** Name unique within this basis, distinct from every channel id. */
  id: string;

  /** Driving sides or shoulder pose kernels, all multiplied. */
  inputs: (
    | {
        channel: string;
        side: "positive" | "negative";
        /** Weight toward `side` at which the ramp leaves zero; zero when absent. */
        onset?: number;
        /** Weight toward `side` at which the ramp reaches one; one when absent, above `onset` and within the envelope on that side. */
        full?: number;
      }
    | {
        bone: AutoMovieHumanoidBone;
        axis: "flexion" | "abduction" | "twist" | "elevation";
        /** Positive counts clinical degrees above the rest angle, negative below it. */
        side: "positive" | "negative";
        /** Degrees from rest at which the ramp leaves zero. */
        onset: number;
        /** Degrees from rest at which the ramp reaches one; above `onset` and within the range. */
        full: number;
      }
    | {
        /** Humerus whose whole physical orientation gates the corrective. */
        shoulder: "leftUpperArm" | "rightUpperArm";
        /** TT coordinates of the kernel's central humerothoracic pose. */
        orientation: {
          plane: number;
          elevation: number;
          axialRotation: number;
        };
        /** Angular distance at or within which the kernel reaches one. */
        innerDegrees: number;
        /** Angular distance at or beyond which the kernel is zero. */
        outerDegrees: number;
      }
  )[];

  /** Authored gain in (0,1]. */
  weight: number;

  /** Endpoint name, resolved in every surface's targets and in the landmarks. */
  target: string;
}
