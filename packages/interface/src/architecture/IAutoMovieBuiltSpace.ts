import type { IAutoMovieConvexSpaceCell } from "./IAutoMovieConvexSpaceCell";
import type { IAutoMovieSpaceShell } from "./IAutoMovieSpaceShell";

/**
 * One named semantic region, independent of visible walls and slabs.
 *
 * A space states its volume at most one way, in {@link cells} or in
 * {@link shell}. Stating both is refused, because two spellings of one region
 * can be edited apart and the containment query would have to pick a winner
 * nobody authored. Stating neither makes a purely semantic container that
 * locates nothing and contains no point.
 */
export interface IAutoMovieBuiltSpace {
  /** Stable logical-space identity, unique within the environment. */
  id: string;

  /**
   * Non-blank open label such as `building`, `storey`, `room`, `attic`, `void`,
   * `roof-deck`, `facade-access`, or `bridge-deck`.
   */
  kind: string;

  /**
   * Parent logical-space id, or null for a root partition; every root must be
   * some building unit's root space, and the parent chain may not cycle.
   */
  parent: string | null;

  /**
   * World-space convex cells whose union locates the region. An empty list with
   * no shell is a semantic container; a non-convex region may be split into
   * cells. Individually convex cells do not imply their combined union is
   * convex.
   *
   * A finite convex decomposition can represent a bounded polyhedral region in
   * exact geometry, including concavity and voids. The stored plane values and
   * binary64 query tolerances delimit the actual answer; downstream cell-volume
   * totals can also count overlaps more than once. Curved boundaries require a
   * faceted declaration, while a shell can state a void without a manual cell
   * decomposition.
   */
  cells: IAutoMovieConvexSpaceCell[];

  /**
   * The region as its own closed triangle boundary, when half-space cells would
   * state it awkwardly.
   *
   * A storey pierced by an atrium is one shell rather than a hand decomposition
   * into cells, which IFC likewise allows through a faceted B-rep with voids. A
   * shell is authoritative for containment wherever it is stated, it is
   * mutually exclusive with {@link cells}, and it is flat-faced: a dome authored
   * here is the facets it is written as, which {@link fidelity} declares.
   */
  shell?: IAutoMovieSpaceShell;

  /**
   * What the stated volume claims to be, when it claims less than the region.
   *
   * Absent, or `exact`, says the cells or the shell are the region: a
   * rectilinear room, a chamfered lobby, a slab with a rectangular void.
   *
   * `faceted` says they only stand in for it. A dome, a barrel vault, and a
   * free-form soffit have curved boundaries, and this record carries no curved
   * primitive, so an author can write only flats. Every derived quantity,
   * section, and containment answer over such a space is the facets' answer,
   * and the drawing schedule and quantity take-off report that.
   *
   * It is a declaration, not a measurement: nothing can look at flats and tell
   * whether a curve was meant. Declaring it on a space that states no volume is
   * refused, because there is nothing for it to approximate.
   */
  fidelity?: "exact" | "faceted";
}
