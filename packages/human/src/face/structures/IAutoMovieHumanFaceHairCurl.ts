/**
 * Authored direction modulation along a scalp lock. Angle and wavelength describe the integrated centreline's desired wave or helix, not a measured natural curl grade, mechanical stress-free shape or physiological capacity. Contact can change the realised path.
 *
 * @evidence contracts/common.md#principled-implementation expandHumanFaceHairTraits converts degrees and millimetres into the existing radian/metre wave or helix field, preserving the authored modulation rather than importing a strand path.
 * @evidence contracts/common.md#clear-and-simple-design Mode, angular amplitude, period and onset are independent inputs to one arc-length direction field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The numerical layer owner checks the open 90-degree bound and eight-step wavelength requirement; no curl grade, mechanical rest shape or contact success is inferred from these values.
 * @evidence contracts/common.md#meaningful-documentation Degree/mm trait units and the possibility of contact-altered curves distinguish desired modulation from realised geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no conversion or trigonometric integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It specifies modulation inputs without caching evaluated phases or curves.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The four-field record retains no strand samples or renderer resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairCurl {
  /** Closed choice of planar oscillation or rotating modulation. */
  mode: "wave" | "helix";

  /** Maximum direction deflection in [0,90) degrees; zero is straight. */
  angleDegrees: number;

  /** Positive modulation period in millimetres of centreline arc length. */
  wavelengthMm: number;

  /** Positive arc length in millimetres for the exponential onset. */
  onsetMm: number;
}
