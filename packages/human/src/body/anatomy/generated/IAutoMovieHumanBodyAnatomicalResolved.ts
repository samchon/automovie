import type { IAutoMovieHumanBodyAnatomicalValidation } from "./IAutoMovieHumanBodyAnatomicalValidation";

/**
 * A named anatomical component generated and validated on held-out anatomy.
 *
 * @evidence contracts/common.md#principled-implementation The value is bound to its generator revision and validation.
 * @evidence contracts/common.md#clear-and-simple-design The resolved branch of the resolution union as its own record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A resolved value cannot exist without validation.
 * @evidence contracts/common.md#meaningful-documentation States each field's meaning.
 * @evidence contracts/modeling.md#part-identity-and-grouping The id binds the generated value to one named part or the skin.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The value type owns its geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The value type owns its frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It renders nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The validation record owns the source statement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The generator owns admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is generated output, not an authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAnatomicalResolved<
  Id extends string,
  Value,
> {
  /** Stable identity of the anatomical part or shared skin. */
  readonly id: Id;
  /** Geometry passed the named validation cohort and domain checks. */
  readonly status: "resolved";
  /** Generated component, never user-authored mesh input. */
  readonly value: Value;
  /** Population prior may remain even when no individual imaging exists. */
  readonly source: "measurement-conditioned" | "population-predicted";
  /** Revision identity of the shape generator evaluated below. */
  readonly generatorRevision: string;
  /** Held-out 3D surface error, not merely volume or landmark fit. */
  readonly validation: IAutoMovieHumanBodyAnatomicalValidation;
}
