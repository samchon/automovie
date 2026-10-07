import type { IAutoMovieHumanFaceOpticalSupportGaze } from "./IAutoMovieHumanFaceOpticalSupportGaze";

/**
 * Exact witness of the existing rigid owner configuration of one eye, as the
 * optical source producer saw it.
 *
 * The articulation's centre landmark remains the rotation pivot; this record
 * lets the consumer refuse a support produced against another configuration.
 *
 * @evidence contracts/common.md#principled-implementation Witnesses the existing pivot and gaze list rather than redefining them.
 * @evidence contracts/common.md#clear-and-simple-design Two named fields replace an anonymous property type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never a second motion law.
 * @evidence contracts/common.md#meaningful-documentation States the witness role and the pivot ownership.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The gaze entries state their own frame and units.
 * @evidenceExclude contracts/modeling.md#parameter-channels Names existing channels; defines none.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Defines no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The connected builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The basis articulation owns its sources.
 * @evidenceExclude contracts/anatomy.md#permitted-range Introduces no bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority A witness, not a control.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOpticalSupportRigid {
  /** Existing eye centre landmark identity. */
  center: string;

  /** Existing gaze list in composition order, with its authored units unchanged. */
  gaze: IAutoMovieHumanFaceOpticalSupportGaze[];
}
