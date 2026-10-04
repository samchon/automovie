import type { IAutoMovieHumanFaceSourceClosureRow } from "./IAutoMovieHumanFaceSourceClosureRow";

/**
 * Compiled source correspondence for a performed closed facial span.
 * All vertex identities address the replayed face surface, not the raw full
 * source or retained native prefix. A pair may reuse its one physical original
 * commissure; distinct normal aliases keep their separate rendered identities.
 *
 * The source compiler qualifies the native closure field and fixed boundaries,
 * registers opposite contact cells, and supplies sparse displacement rows.
 * Runtime reads fixed closure-zero/one native poses with the same other inputs,
 * forms this endpoint after refinement replay, and applies the request once.
 * Coefficients are dimensionless offline data, not a runtime tissue solver.
 * The representative is one registered source pair and cannot certify the
 * complete margin, tissue thickness, colliders or final rendered assembly.
 *
 * @evidence contracts/common.md#principled-implementation Registers performed contact pairs and anchored sparse endpoint displacements with one requested blend; the compiler retains source support and correspondence qualification.
 * @evidence contracts/common.md#clear-and-simple-design One source generation/surface/layout and paired drivers define the endpoint separately from native posing and rigid contact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source identities and coefficients are compiled data with no personal coordinates, neck index mask, runtime solve or coefficient normalization.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes raw/native/performed domains, source qualification, units, aliases, requested-weight ownership and representative limits.
 * @evidence contracts/modeling.md#shared-boundaries Registered source pairs receive a shared endpoint after posing; source qualification preserves the actual common neck and its complete parent neighborhood.
 * @evidence contracts/modeling.md#spatial-conventions IDs and coefficients are dimensionless; the consumer retains one common performed metre/head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Binds an existing surface and defines no anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Compiled shared-source data defines no person authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The compiler owns the fixed vertex/cell population; this record emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation Source compiler and face assembly observe the resulting geometry; this transport record displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Defines source correspondence and arithmetic, not measured tissue or a biological law.
 * @evidenceExclude contracts/anatomy.md#permitted-range The arithmetic request domain is not a physiological motion range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Introduces no personal vertex, curve or sculpt input.
 */
export interface IAutoMovieHumanFaceSourceClosurePlan {
  /** Must match the selected surface's supplied pose/normal source generation. */
  readonly generation: string;

  /** Existing source surface receiving the refined closed endpoint. */
  readonly surface: string;

  /** Complete performed vertex count after native refinement replay. */
  readonly vertices: number;

  /** Dense, uniquely owned upper/lower performed source point pairs. */
  readonly contactPairs: readonly (readonly [number, number])[];

  /** Sparse anchored displacement rows over performed source identities. */
  readonly rows: readonly IAutoMovieHumanFaceSourceClosureRow[];

  /** A registered upper/lower pair with producer-owned source-chart provenance. */
  readonly representativePair: readonly [number, number];
}
