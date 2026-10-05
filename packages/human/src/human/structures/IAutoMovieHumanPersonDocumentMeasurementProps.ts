import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonGenerationBuild } from "./IAutoMovieHumanPersonGenerationBuild";

/**
 * Inputs of `measureHumanPersonDocument`: the one-skin evaluator, the person
 * and the body channel that names the measurement.
 *
 * @evidence contracts/common.md#principled-implementation The caller owns the evaluator, so a reading reuses one compiled generation.
 * @evidence contracts/common.md#clear-and-simple-design Four fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The person is the whole document, read on its actual build.
 * @evidence contracts/common.md#meaningful-documentation States what each field is.
 * @evidence contracts/modeling.md#parameter-channels The channel id names the measurement rule.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The props define no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The props emit no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The props carry no value with a unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The props build no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The props are not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The measurement rule owns the source.
 * @evidenceExclude contracts/anatomy.md#permitted-range The props admit nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The props convert no input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonDocumentMeasurementProps {
  /**
   * The one-skin evaluator of the person's generation.
   *
   * @evidence contracts/common.md#principled-implementation The reading is taken on the caller's compiled evaluator, never a second one.
   * @evidence contracts/common.md#clear-and-simple-design One document in, one build out.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The reading is the actual person build, not a surrogate surface.
   * @evidence contracts/common.md#meaningful-documentation States which evaluator it is.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The evaluator owns the parts it builds.
   * @evidenceExclude contracts/modeling.md#parameter-channels The evaluator owns channel evaluation.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The evaluator owns the geometry it emits.
   * @evidenceExclude contracts/modeling.md#spatial-conventions The evaluator owns its frame.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The evaluator owns the boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The member displays nothing.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The member carries no anatomical value.
   * @evidenceExclude contracts/anatomy.md#permitted-range The member admits nothing.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The member converts no input.
   */
  build: (document: IAutoMovieHumanPersonDocument) => IAutoMovieHumanPersonGenerationBuild;

  /** The body view of the person's generation, which declares the rule's skin point. */
  body: IAutoMovieHumanBodyBasis;

  /** The person to measure. */
  document: IAutoMovieHumanPersonDocument;

  /** The body channel id that names the person measurement rule. */
  channel: string;
}
