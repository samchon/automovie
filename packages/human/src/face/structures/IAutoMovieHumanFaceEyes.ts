import type { IAutoMovieHumanFaceOpticalDimensions } from "./IAutoMovieHumanFaceOpticalDimensions";

/**
 * A document's independent optical dimensions for each eye.
 *
 * Each side takes the seven explicit dimensions of one authored optical core
 * (`IAutoMovieHumanFaceOpticalDimensions`). They need the basis's
 * producer-qualified optical support for that side; without it the builder
 * refuses the document by name instead of approximating a globe. Omission
 * keeps the basis's authored globes byte for byte.
 *
 * @evidence contracts/common.md#principled-implementation Each side reuses the one optical-dimension definition the optical builder consumes.
 * @evidence contracts/common.md#clear-and-simple-design Two named sides.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No asset name or subject selects behaviour; a missing registration refuses by name.
 * @evidence contracts/common.md#meaningful-documentation States units, omission and the refusal without registration.
 * @evidence contracts/modeling.md#spatial-conventions Dimensions are millimetres and micrometres as the dimension type states.
 * @evidence contracts/modeling.md#parameter-channels The dimensions are named geometry inputs of the optical core, independent of skin channels.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The periocular registration names the parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The face builder emits geometry.
 * @evidence contracts/modeling.md#shared-boundaries Placement comes from the basis optical support, shared with the lid contact.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The dimension type states they are geometry inputs, not clinical measurements.
 * @evidence contracts/anatomy.md#permitted-range Admission applies the optical profile's containment inequalities to each side.
 * @evidence contracts/anatomy.md#parametric-authority Named dimensions only; no vertex or sculpt offset.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEyes {
  /** Optical dimensions of the anatomical left eye. */
  left: IAutoMovieHumanFaceOpticalDimensions;

  /** Optical dimensions of the anatomical right eye. */
  right: IAutoMovieHumanFaceOpticalDimensions;
}
