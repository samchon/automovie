/*
 * Symmetric timing limits in coordinate units per second squared. The limits
 * take the largest absolute acceleration in Perry (2006), Table 2.1, across the
 * five reported activities. These pilot measurements set the authored timing
 * scale.
 *
 * Perry's Figure 2.2 maps the shoulder's long axis (shz), elbow hinge and
 * forearm's long axis (wristz) to twist, flexion and pronation. The wrist x and
 * y axes are flexion and deviation, respectively. The chart uses the faster of
 * the two measured shoulder swing axes on both components, as the arm's
 * velocity table does. Elbow abduction and wrist twist are locked in the
 * default rig and have no measured bound.
 * ://hdl.handle.net/1773/7077
 * et al. (2005), ICAR, Table I and Figure 3, https://web.archive.org/web/20240415031915id_/http://bionics.seas.ucla.edu/publications/CP_19.pdf
 * @see https://hdl.handle.net/1773/7077
 * @see Rosen et al. (2005), ICAR, Table I and Figure 3, https://web.archive.org/web/20240415031915id_/http://bionics.seas.ucla.edu/publications/CP_19.pdf
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
