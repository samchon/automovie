import { tags } from "typia";

/**
 * The standing sagittal posture: the radiographic angles and distances that shape the spine's curves in the side view, and the head's carriage.
 *
 * Every value is taken standing at ease with hips and knees extended, as the clinical surveys measure it. Pelvic incidence, a fixed shape of the pelvis, is the sum of pelvic tilt and sacral slope.
 */
export interface IAutoMovieHumanPosture {
  /**
   * Pelvic tilt: the angle from the vertical of the line from the axis of the femoral heads to the midpoint of the sacral plate, degrees, positive when the sacral plate lies behind the hips. It rises with age as the pelvis tilts back, about 12 to 15 degrees under 50 and 20 to 25 at 80 (Asai et al. 2017, PLoS ONE 12(6):e0178697).
   */
  pelvicTilt: number & tags.Minimum<-30> & tags.Maximum<60>;

  /**
   * Sacral slope: the angle of the sacral plate, the top of the first sacral vertebra, from the horizontal, degrees, its front edge lower. The lumbar spine leaves the sacrum perpendicular to the plate, leaning forward by this angle.
   */
  sacralSlope: number & tags.Minimum<0> & tags.Maximum<80>;

  /**
   * Thoracic kyphosis: the Cobb angle of the thoracic curve from the second to the twelfth thoracic vertebra, degrees, positive for the normal backward convexity. About 33 under 50 and 40 to 44 at 80 (Asai et al. 2017).
   */
  thoracicKyphosis: number & tags.Minimum<-20> & tags.Maximum<100>;

  /**
   * Sagittal vertical axis: the horizontal distance from the plumb line through the centre of the seventh cervical vertebral body to the posterior superior corner of the sacral plate, millimetres, positive in front. Under 50 the neck stands 10 to 20 mm behind the sacrum; at 80 and over 40 to 50 mm in front (Asai et al. 2017).
   */
  sagittalVerticalAxis: number & tags.Minimum<-200> & tags.Maximum<400>;

  /**
   * Craniovertebral angle: the angle above the horizontal of the line from the seventh cervical spinous process to the tragus, degrees; smaller is a head carried further forward. About 48 to 50 in adults, falling 1.6 degrees a decade (Zárate-Tejero et al. 2024, Appl Sci 14:8639).
   */
  craniovertebralAngle: number & tags.Minimum<10> & tags.Maximum<90>;
}
