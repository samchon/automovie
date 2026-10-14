import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Native lid-annulus topology and exact displacement constraints supplied by
 * the lid seating owner. This is internal source interpolation, not a public
 * sculpting input. Source sample identities identify seam copies exactly.
 *
 * All positions and displacement pins use the same head-local metre frame.
 * Every topological boundary sample needs an explicit pin, including stationary
 * boundaries. Interior cage stations may also be pinned. The helper refuses
 * conflicting pins on aliases instead of selecting one by insertion order.
 *
 *
 * @evidence contracts/common.md#principled-implementation Complete native annulus incidence and exact source-sample constraints define the positive-weight Dirichlet problem.
 * @evidence contracts/common.md#clear-and-simple-design The seating owner supplies geometry while interpolateHumanFaceLidDisplacement owns quotient/admission/solve.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every boundary sample needs a pin and aliases may not select conflicting displacement by insertion order.
 * @evidence contracts/common.md#meaningful-documentation The prose states metre inputs, internal source interpolation and complete boundary obligations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceLidDisplacementInput is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceLidDisplacementInput declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceLidDisplacementInput itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
 */
export interface IHumanFaceLidDisplacementInput {
  /** Unmodified flat XYZ source positions in head-local metres. */
  positions: readonly number[];

  /** Flat triangle indices of the complete selected native lid annulus. */
  indices: readonly number[];

  /** Canonical source sample identity for every vertex in positions. */
  samples: readonly number[];

  /** Exact metre displacements at boundary and optional interior stations. */
  pins: ReadonlyMap<number, IAutoMovieVector3>;

  /** Complete topological boundary vertices; aliases name the same sample. */
  boundaryVertices: readonly number[];
}
