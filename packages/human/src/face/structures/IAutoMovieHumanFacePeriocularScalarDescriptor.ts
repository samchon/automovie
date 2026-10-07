/**
 * Default, authoring interval and ground of one lid tissue dimension, in
 * millimetres.
 *
 * `kind` separates what a read source measured from what was derived from
 * measured values and from what is authored where no source answers.
 * `ground` names the source with its quantity, site and population, or the
 * derivation, or says that the value is authored. The interval is an
 * authoring envelope for an editor; it is not a clinical normal range, and
 * the lid frame still refuses a value the constructed lid cannot hold.
 *
 * @evidence contracts/common.md#principled-implementation Keeps the value, its interval, its kind and its ground in one record so a consumer cannot show a default without its qualification.
 * @evidence contracts/common.md#clear-and-simple-design Five fields per dimension.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no subject, document or part-specific override.
 * @evidence contracts/common.md#meaningful-documentation States unit, the meaning of each kind and that the interval is no clinical range.
 * @evidence contracts/modeling.md#parameter-channels One absolute measurement in millimetres with its default; it is not a neutral-zero offset.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres.
 * @evidence contracts/anatomy.md#anatomical-source The kind and ground fields carry the source statement each value owes.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Describes a dimension, not a part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation Not displayed geometry.
 * @evidenceExclude contracts/anatomy.md#permitted-range The interval is an authoring envelope; the lid frame owns admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The tissue section type owns the input; this describes it.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularScalarDescriptor {
  /** Default value. */
  defaultMm: number;

  /** Lower end of the authoring envelope. */
  minimumMm: number;

  /** Upper end of the authoring envelope. */
  maximumMm: number;

  /** Whether the default was measured by a read source, derived from measured values, or authored. */
  kind: "measured" | "derived" | "authored";

  /** Source with quantity, site and population, or the derivation, or the statement that it is authored. */
  ground: string;
}
