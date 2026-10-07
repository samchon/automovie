/**
 * Independent dimensions and presence of one source crown in an authored oral
 * assembly. These are source-local geometric dimensions, not a clinical cast
 * measurement, anatomical CEJ registration or a claim about eruption. Omitted
 * dimensions retain that shared crown's current source shape. The first coarse
 * producer uses the shared head X/Y/Z axes, not a measured tooth long axis.
 *
 * @evidence contracts/common.md#principled-implementation Three independent positive source-head extents scale one licensed source crown about its cervical port; presence removes its actual rendered and collision geometry.
 * @evidence contracts/common.md#clear-and-simple-design A crown has dimensions and presence; arch placement and gingiva belong to their group.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No personal mesh, vertex or curve is an input and unknown clinical eruption is not inferred.
 * @evidence contracts/common.md#meaningful-documentation Separates authored source dimensions from clinical crown protocol and states omission.
 * @evidence contracts/modeling.md#parameter-channels Width, depth and height vary separate local axes; presence varies the part population.
 * @evidence contracts/modeling.md#spatial-conventions Dimensions are millimetres along shared head X/Y/Z; clinical tooth axes remain unregistered.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The crown producer owns the part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The source crown producer owns primitive counts.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The assembly constructs the shared cervical boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The oral assembly observes the crown and its neighbors.
 * @evidence contracts/anatomy.md#anatomical-source Licensed source crown geometry supplies a coarse form; these authored dimensions do not identify a person's clinical anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range The oral assembler admits positive finite dimensions and the joint geometry.
 * @evidence contracts/anatomy.md#parametric-authority Inputs are named source-crown dimensions, never personal vertex coordinates.
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
