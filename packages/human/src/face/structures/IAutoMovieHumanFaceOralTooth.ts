/**
 * Independent dimensions and presence of one source crown in an authored oral
 * assembly. These are source-local geometric dimensions, not a clinical cast
 * measurement, anatomical CEJ registration or a claim about eruption. Omitted
 * dimensions retain that shared crown's current source shape. The first coarse
 * producer uses the shared head X/Y/Z axes, not a measured tooth long axis.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralTooth {
  /** Source head-X maximum breadth, positive finite mm; not clinical MD width. */
  widthMm?: number;

  /** Source head-Z maximum breadth, positive finite mm; not clinical BL width. */
  depthMm?: number;

  /** Source head-Y maximum extent, positive finite mm; not clinical exposure. */
  heightMm?: number;

  /** Actual authored crown presence; omission retains the source component. */
  present?: boolean;
}
