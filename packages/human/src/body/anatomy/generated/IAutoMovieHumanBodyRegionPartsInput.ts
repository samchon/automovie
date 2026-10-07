import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "../measurements/IAutoMovieHumanBodyAnatomicalMeasurements";

/**
 * What a region's part resolver reads: the document's anatomy, if
 * any, and the compiled source basis.
 *
 * Document admission preserves anatomical measurements and registered raw
 * observations before this carrier reaches a region resolver. A consumer
 * without anatomical input
 * (the shape-weight body editor) omits `targets` and receives each part's
 * source reason without inventing an age, stature or mass; completeness of a
 * document stays with document admission. The basis lets a resolver state that a
 * defining landmark or tissue boundary is absent from the source.
 *
 * @evidence contracts/common.md#principled-implementation Regions read the admitted document anatomy and its compiled basis without re-deriving measurements or observations.
 * @evidence contracts/common.md#clear-and-simple-design Two read-only members shared by every region resolver.
 * @evidenceExclude contracts/common.md#prohibited-implementation-shortcuts A carrier; it substitutes nothing.
 * @evidence contracts/common.md#meaningful-documentation Identifies document anatomy as the input and explains why the source basis is present.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Members own their units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It renders nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The measurement types own their definitions.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission happened before this input exists.
 * @evidence contracts/anatomy.md#parametric-authority Carries only named anatomical targets.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyRegionPartsInput {
  /** Admitted document anatomy, including registered observations; omitted without anatomy. */
  readonly targets?: IAutoMovieHumanBodyAnatomicalMeasurements;

  /** The compiled source basis the exterior was built from. */
  readonly basis: IAutoMovieHumanBodyBasis;
}
