/**
 * A closed anterior optical shell, in the shared millimetre frame. Angular
 * extents clip it to the visible aperture; they contain one sample per column,
 * without a duplicated closing sample. Front/back surfaces share a joined rim.
 * Curvature is added relative to the underlying spherical globe so the limbus
 * retains one declared lift. This is a rendering approximation of the anterior
 * optical surface, not a complete physiological model of the eye.
 *
 * @evidence contracts/common.md#principled-implementation The record holds what the shell builder reads: the in-plane centre, the unclipped aperture radius, the corneal and globe curvature radii, the shell thickness and rim lift, one visible reach per angular column, the ring count and the support height query. Together they fix the front surface by its sag relative to the globe, the offset back surface and the rim wall.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with one producer, `buildPortraitEyeCornea`, and one consumer, `buildPortraitCornea`, so the shell has no second description.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no field names a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation The record states its units, that extents clip the shell to the aperture with one sample per column, that the two surfaces share a joined rim, that the sag is relative to the globe and that it is a rendering approximation and not a physiological model.
 * @evidence contracts/modeling.md#spatial-conventions Every length is millimetres in the shared head frame and the support height is read at a head-frame X and Y, as the record and its fields state.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record describes one shell for the builder and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive; its column and ring counts are read by the builder that emits the shell.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 *
 * @author Samchon
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

  /**
   * Underlying globe surface height, in millimetres, at a head-frame X/Y.
   *
   * @evidence contracts/common.md#principled-implementation A height query over the head XY plane is all the shell builder needs to place its rim on the fitted globe, and it is supplied by the eye so the shell and the globe share one surface.
   * @evidence contracts/common.md#clear-and-simple-design One function member with one caller and no state, so the shell builder never reconstructs the globe.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A callback member of a record carries no mechanism and names no subject or fixture.
   * @evidence contracts/common.md#meaningful-documentation The comment states the returned quantity, its unit and its argument frame.
   * @evidence contracts/modeling.md#spatial-conventions Arguments and result are head millimetres in the head frame (+Z anterior), as the comment states.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The callback answers a height at a point. It defines no part or group.
   * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface.
   * @evidenceExclude contracts/modeling.md#rendered-observation It owns no part and displays nothing.
   * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
   * @evidenceExclude contracts/anatomy.md#permitted-range It admits or bounds no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority It is a query supplied by the eye, not an input through which a caller shapes a face.
   */
  surface: (x: number, y: number) => number;
}
