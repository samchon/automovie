/**
 * A closed anterior optical shell, in the shared millimetre frame. Angular
 * extents clip it to the visible aperture; they contain one sample per column,
 * without a duplicated closing sample. Front/back surfaces share a joined rim.
 * Curvature is added relative to the underlying spherical globe so the limbus
 * retains one declared lift. This is a rendering approximation of the anterior
 * optical surface, not a complete physiological model of the eye.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Defines a closed anterior optical shell separately from the sclera and iris pigment.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Carries the aperture, globe/corneal curvatures, rim lift, positive axial thickness and angular clipping in construction millimetres.
 */
export interface IPortraitCornea {
  /** In-plane centre of the iris/corneal aperture; surface supplies its depth. */
  center: { x: number; y: number };
  /** Unclipped aperture radius, in millimetres. */
  radius: number;
  /** Corneal surface curvature radius, greater than the aperture radius. */
  curvature: number;
  /** Underlying spherical curvature radius, at least the corneal curvature. */
  globeRadius: number;
  /** Positive axial separation of the two shell surfaces, in millimetres. */
  thickness: number;
  /** Front-rim lift from the underlying globe, greater than shell thickness. */
  rimLift: number;
  /** Positive visible radial reach at each equally spaced angular column. */
  extents: number[];
  /** Positive integral count of concentric rings on each surface. */
  radialSamples: number;
  /** Underlying globe surface height, in millimetres, at a head-frame X/Y. */
  surface: (x: number, y: number) => number;
}
