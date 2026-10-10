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
