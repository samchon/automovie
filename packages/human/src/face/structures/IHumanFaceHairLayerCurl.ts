/**
 * Existing metre/radian wave or helix field of a connected numerical hair layer.
 * Contact may change the realised path; this is not stress-free rod mechanics.
 *
 * @evidence contracts/common.md#principled-implementation Wave or helix deflection uses metric wavelength and exponential arc onset; admission requires at least eight integration steps per wavelength, but contact can change the realised curl.
 * @evidence contracts/common.md#clear-and-simple-design These four coefficients belong to the layer direction field; strand integration owns turning and contact admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The angle domain and step-to-wavelength constraint are numerical field admission, not a measured constitutive hair law.
 * @evidence contracts/common.md#meaningful-documentation Members specify the mode, radian deflection domain and positive metre wavelength and onset distance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This coefficient record executes no wave evaluation, helix modulation or strand integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Curl coefficients define no compiled direction-field cache or station equivalence policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no centreline buffers or contact reader; the layer and integrator own those values.
 * @author Samchon
 */
export interface IHumanFaceHairLayerCurl {
  /** Planar wave or rotating direction modulation. */
  mode: "wave" | "helix";

  /** Maximum deflection in [0,pi/2) radians. */
  angle: number;

  /** Positive centreline wavelength, metres, with eight integration intervals. */
  wavelength: number;

  /** Positive exponential onset distance, metres. */
  reach: number;
}
