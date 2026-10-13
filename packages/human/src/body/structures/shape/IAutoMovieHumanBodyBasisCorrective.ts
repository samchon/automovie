import type { AutoMovieHumanoidBone } from "@automovie/interface";


/**
 * One rest-space corrective endpoint gated by shape or pose drivers, evaluated by `humanBodyBasisWeights` before skinning carries the displacement with its bone.
 *
 * Channel drivers ramp the signed weight from `onset` to `full`, defaulting to zero and one. Joint drivers ramp clinical degrees from the declared rest toward the selected side. Shoulder kernels gate the full humerothoracic orientation by angular distance. Driver factors multiply the authored gain, with activation capped at one. Overlapping shoulder kernels in one family and overlapping shape examples of one pose are normalized by their family's factor sum when it exceeds one, so examples interpolate instead of stacking whole corrections.
 *
 * These sampled displacement rows repair legacy exterior forms. Their independent sum cannot enforce arbitrary bilateral contact or tissue volume, and combined rows can fold skin even when each family alone remains clear. Contact needs a separate posed-surface constraint; increasing a corrective gain does not supply one.
 *
 * @evidence contracts/common.md#principled-implementation Driver ramps and shoulder orientation kernels gate one rest-space endpoint; kernel and shape families normalize overlapping examples in the weight owner.
 * @evidence contracts/common.md#clear-and-simple-design The corrective declaration stores driver conditions, gain and target while shared evaluation owns activation arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Independent displacement rows cannot enforce arbitrary bilateral contact or tissue volume, and stronger gains do not supply those constraints.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes driver domains, family interpolation, rest-space application and contact limitations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The rest-space corrective schema has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The rest-space corrective schema schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The rest-space corrective schema declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisCorrective {
  /** Name unique within this basis, distinct from every channel id. */
  id: string;


  /** Driving sides or shoulder pose kernels, all multiplied. */
  inputs: (
    | {
        /** Basis shape channel whose signed weight drives this ramp. */
        channel: string;

        /** Which sign of the shape weight drives the ramp. */
        side: "positive" | "negative";


        /** Weight toward `side` at which the ramp leaves zero; zero when absent. */
        onset?: number;

        /** Weight toward `side` at which the ramp reaches one; one when absent, above `onset` and within the envelope on that side. */
        full?: number;
      }
    | {
        /** Declared rig joint whose rest-relative angle drives this ramp. */
        bone: AutoMovieHumanoidBone;

        /** Clinical coordinate, or total thorax-relative upper-arm elevation. */
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
          /** TT elevation plane, degrees, with zero lateral and positive anterior. */
          plane: number;

          /** Total humerothoracic elevation from the hanging arm, degrees. */
          elevation: number;

          /** Humeral axial rotation, degrees, positive external. */
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
