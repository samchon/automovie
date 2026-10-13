/**
 * Intermediate anatomical controls, expressed as offsets from the recorded
 * recipe. Zero retains that recipe; final detail values are resolved afterward.
 *
 * @evidence contracts/common.md#principled-implementation Named intermediate ratio/millimetre offsets apply to an owned baseline recipe before detail overrides, with zero omission and finite authored envelopes checked by applyHumanFaceControls.
 * @evidence contracts/common.md#clear-and-simple-design One optional scalar per supported feature separates intermediate offsets from absolute detailed fields and transient expression.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These supported authoring envelopes are not universal physiological ranges; missing cheek support refuses and combined detailed geometry still needs its own attachment/admission checks.
 * @evidence contracts/common.md#meaningful-documentation Each member states baseline-relative sign, units, supported bounds and feature meaning, including optical identity versus blink and cheek prerequisites.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface computes no recipe transform or combined-geometry check.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Offsets supply inputs rather than cached recipes or shared component fitting.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The personal document owns optional scalars and this type acquires no profile buffers or task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceControls {
  /** Facial transverse scale offset in [-0.2,0.2]; positive widens the shared host. */
  faceWidth?: number;

  /** Nasion-centred facial length scale offset in [-0.2,0.2]; positive lengthens. */
  faceLength?: number;

  /** Eye aperture width ratio offset in [-0.4,0.4]; positive widens both eyes. */
  eyeWidth?: number;

  /** Eye aperture height ratio offset in [-0.4,0.4]; positive enlarges the identity aperture, not blink. */
  eyeHeight?: number;

  /** Outer canthus vertical offset in [-4,4] mm; positive raises both lateral corners. */
  eyeTilt?: number;

  /** Nasal width ratio offset in [-0.4,0.4]; positive widens the exterior and bound cavities. */
  noseWidth?: number;

  /** Nasal tip projection offset in [-8,8] mm; positive moves the tip anteriorly. */
  noseProjection?: number;

  /** Oral width ratio offset in [-0.4,0.4]; positive widens the bound vermilion. */
  mouthWidth?: number;

  /** Upper vermilion anterior projection offset in [-3,3] mm. */
  upperLipProjection?: number;

  /** Lower vermilion anterior projection offset in [-3,3] mm. */
  lowerLipProjection?: number;

  /** Malar and medial cheek projection offset in [-5,5] mm; requires a cheek profile. */
  cheekProjection?: number;

  /** Cranial station half-width ratio offset in [-0.3,0.3]. */
  craniumWidth?: number;

  /** Superior cranial envelope vertical offset in [-20,20] mm. */
  craniumHeight?: number;

  /** Pinna outline height ratio offset in [-0.3,0.3]; preserves the host attachment. */
  earHeight?: number;

  /** Cervical section transverse-width ratio offset in [-0.3,0.3]. */
  neckWidth?: number;
}
