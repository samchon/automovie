import type { IAutoMovieHumanFaceBasisJawLaterotrusion } from "./IAutoMovieHumanFaceBasisJawLaterotrusion";
import type { IAutoMovieHumanFaceBasisJawOpening } from "./IAutoMovieHumanFaceBasisJawOpening";
import type { IAutoMovieHumanFaceBasisJawTranslation } from "./IAutoMovieHumanFaceBasisJawTranslation";

/**
 * The articulated mandible: its pivot landmark and condylar offset, its
 * rotation axis, the channel-driven opening, protrusion and laterotrusion, and
 * the supported sagittal translation budget
 * (`IAutoMovieHumanFaceBasis.articulation` states the trajectory).
 *
 * @evidence contracts/common.md#principled-implementation The mandible's fields, extracted from the articulation declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design Pivot, offset, axis, three motions and a budget.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A document past the budget is refused rather than clamped (`IAutoMovieHumanFaceBasis.articulation`).
 * @evidence contracts/common.md#meaningful-documentation States each field's unit and points to the documented trajectory.
 * @evidence contracts/modeling.md#spatial-conventions Metres and degrees in the basis head frame, right-handed and Y-up.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record names channels the basis declares; it defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed; the evaluated face is observed by its owners.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The basis declaration cites the sources of the model this record belongs to.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission of the basis bounds these values; the record admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is basis data, not an input a document sets.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisJaw {
  /** Landmark id of the source jaw pivot. */
  pivot: string;

  /** Metre offset from that landmark to the condylar axis point. */
  axisOffset: [number, number, number];

  /** Unit rotation axis; a positive angle opens the mouth. */
  axis: [number, number, number];

  /** Rotation about `axis` with its coupled translation. */
  opening: IAutoMovieHumanFaceBasisJawOpening;

  /** Forward translation of the mandible. */
  protrusion: IAutoMovieHumanFaceBasisJawTranslation;

  /** Sideways translations, one per side. */
  laterotrusion: IAutoMovieHumanFaceBasisJawLaterotrusion;

  /** Supported magnitude of the summed opening and protrusion translation, in metres. */
  translationLimitMetres: number;
}
