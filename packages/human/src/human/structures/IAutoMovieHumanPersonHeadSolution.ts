import type { IAutoMovieHumanHeadReading } from "../../common/measure/IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";

/**
 * A solved head: the person with its head channels set, every head rule read
 * on its skin at rest (the targets and the circumference check alike), and
 * the departure from the standard head the solve chose.
 *
 * @evidence contracts/common.md#principled-implementation The targets, the remeasured values and the chosen departure are reported separately.
 * @evidence contracts/common.md#clear-and-simple-design Three fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every reading is remeasured on the returned person; none is the solver's estimate.
 * @evidence contracts/common.md#meaningful-documentation States what each field is.
 * @evidence contracts/modeling.md#spatial-conventions Readings are metres of the person frame; the departure is metres of skin displacement.
 * @evidenceExclude contracts/modeling.md#parameter-channels The solution names no channel of its own.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed; the solved person is observed on the viewer.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rules cite their definitions.
 * @evidenceExclude contracts/anatomy.md#permitted-range The solution admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The solution is output.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadSolution {
  /** The person with the solve's head channels set. */
  document: IAutoMovieHumanPersonDocument;

  /** Every head rule read on the solved person at rest, by rule name. */
  readings: Record<string, IAutoMovieHumanHeadReading>;

  /**
   * The solved channels' departure from the standard head: the root of the
   * sum of squares of each channel's weight times its departure scale
   * (`humanPersonHeadDeparture`), metres of skin displacement.
   */
  departureMetres: number;
}
