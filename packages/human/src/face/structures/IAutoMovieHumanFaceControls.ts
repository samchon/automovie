/**
 * Intermediate anatomical controls, expressed as offsets from the recorded
 * recipe. Zero retains that recipe; final detail values are resolved afterward.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Separates intermediate trait offsets from detailed part settings.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Gives every intermediate value a fixed neutral and signed interpretation.
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
