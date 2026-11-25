/**
 * Symmetric timing limits in coordinate units per second squared. The limits
 * take the largest absolute acceleration in Perry (2006), Table 2.1, across
 * the five reported activities. These pilot measurements set the authored
 * timing scale.
 *
 * Perry's Figure 2.2 maps the shoulder's long axis (shz), elbow hinge and
 * forearm's long axis (wristz) to twist, flexion and pronation. The wrist x
 * and y axes are flexion and deviation, respectively. The chart uses the
 * faster of the two measured shoulder swing axes on both components, as
 * the arm's velocity table does. Elbow abduction and wrist twist are locked
 * in the default rig and have no measured bound.
 *
 * @see https://hdl.handle.net/1773/7077
 */
export const HUMAN_ARM_COORDINATE_ACCELERATIONS: readonly number[] = [
  1311.7,
  1311.7,
  1049.0,
  1266.1,
  Infinity,
  4343.6,
  2476.2,
  2790.1,
  Infinity,
];
