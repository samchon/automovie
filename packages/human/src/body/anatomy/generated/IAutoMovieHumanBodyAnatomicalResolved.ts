import type { IAutoMovieHumanBodyAnatomicalValidation } from "./IAutoMovieHumanBodyAnatomicalValidation";

/**
 * A named anatomical component generated and validated on held-out anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Generated value, generator revision, conditioning class and held-out surface validation jointly qualify a resolved component.
 * @evidence contracts/common.md#clear-and-simple-design Geometry and scientific qualification stay together rather than making validation optional elsewhere.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Population prediction/measurement conditioning stay distinct, and generated values are never caller-authored meshes.
 * @evidence contracts/common.md#meaningful-documentation Members describe part identity, cohort/domain admission, conditioning provenance and surface-error evidence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Resolved schemas report anatomy without selecting its generator's numerical method.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Revision/validation can qualify downstream reuse but the type performs no memoization.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Generated-value ownership remains with construction; the declaration starts no clinical task.
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
