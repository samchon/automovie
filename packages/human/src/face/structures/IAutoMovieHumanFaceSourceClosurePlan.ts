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
 * @author Samchon
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
