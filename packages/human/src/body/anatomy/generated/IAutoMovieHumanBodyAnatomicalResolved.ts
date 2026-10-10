import type { IAutoMovieHumanBodyAnatomicalValidation } from "./IAutoMovieHumanBodyAnatomicalValidation";

/**
 * A named anatomical component generated and validated on held-out anatomy.
 *
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
