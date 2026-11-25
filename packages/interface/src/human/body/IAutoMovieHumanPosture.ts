/**
 * The standing sagittal posture: the radiographic angles and distances that
 * shape the spine's curves in the side view, and the head's carriage.
 *
 * Every value is taken standing at ease with hips and knees extended, as the
 * clinical surveys measure it. Pelvic incidence, a fixed shape of the pelvis,
 * is the sum of pelvic tilt and sacral slope.
 */
export interface IAutoMovieHumanPosture {
  /**
   * Pelvic tilt: the angle from the vertical of the line from the axis of the
   * femoral heads to the midpoint of the sacral plate, degrees, positive when
   * the sacral plate lies behind the hips. It rises with age as the pelvis
   * tilts back, about 12 to 15 degrees under 50 and 20 to 25 at 80 (Asai et al.
   * 2017, PLoS ONE 12(6):e0178697). Schema constraints: Minimum: -30; Maximum:
   * 60; retained by Human's schema refinement.
   */
  pelvicTilt: number;

  /**
   * Sacral slope: the angle of the sacral plate, the top of the first sacral
   * vertebra, from the horizontal, degrees, its front edge lower. The lumbar
   * spine leaves the sacrum perpendicular to the plate, leaning forward by this
   * angle. Schema constraints: Minimum: 0; Maximum: 80; retained by Human's
   * schema refinement.
   */
  sacralSlope: number;

  /**
   * Thoracic kyphosis: the Cobb angle of the thoracic curve from the second to
   * the twelfth thoracic vertebra, degrees, positive for the normal backward
   * convexity. About 33 under 50 and 40 to 44 at 80 (Asai et al. 2017). Schema
   * constraints: Minimum: -20; Maximum: 100; retained by Human's schema
   * refinement.
   */
  thoracicKyphosis: number;

  /**
   * Sagittal vertical axis: the horizontal distance from the plumb line through
   * the centre of the seventh cervical vertebral body to the posterior superior
   * corner of the sacral plate, millimetres, positive in front. Under 50 the
   * neck stands 10 to 20 mm behind the sacrum; at 80 and over 40 to 50 mm in
   * front (Asai et al. 2017). Schema constraints: Minimum: -200; Maximum: 400;
   * retained by Human's schema refinement.
   */
  sagittalVerticalAxis: number;

  /**
   * Craniovertebral angle: the angle above the horizontal of the line from the
   * seventh cervical spinous process to the tragus, degrees; smaller is a head
   * carried further forward. About 48 to 50 in adults, falling 1.6 degrees a
   * decade (Zárate-Tejero et al. 2024, Appl Sci 14:8639). Schema constraints:
   * Minimum: 10; Maximum: 90; retained by Human's schema refinement.
   */
  craniovertebralAngle: number;
}
