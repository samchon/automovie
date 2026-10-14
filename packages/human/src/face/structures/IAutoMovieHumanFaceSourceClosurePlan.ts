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
 * @evidence contracts/common.md#principled-implementation The pose owner reads fixed closure-zero/one native states with the same other inputs, replays source refinement, then applyHumanFaceSourceClosure forms registered pair means and sparse anchored transition displacements before applying the requested blend once.
 * @evidence contracts/common.md#clear-and-simple-design Generation/surface/layout, contact pairs, transition rows and representative pair have distinct ownership over the performed source domain.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Structural admission requires valid unique contact/transition owners, positive supported drivers and a registered representative even at zero; one representative or offline coefficient field proves no whole-margin seal, tissue or collider validity.
 * @evidence contracts/common.md#meaningful-documentation Performed versus raw/native-prefix identities, source alias meaning and dimensionless offline rows distinguish replay from a runtime tissue solve.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The plan record performs no pair averaging or endpoint blend.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared source plans are immutable input; fixed-state/pose reuse belongs to the evaluator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The publisher owns pairs and rows; this declaration creates no native pose buffers or solver state.
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
