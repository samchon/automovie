import { IAutoMovieConvexSpaceCell } from "./IAutoMovieConvexSpaceCell";
import { IAutoMovieSpaceShell } from "./IAutoMovieSpaceShell";

/**
 * One named semantic region, independent of visible walls and slabs.
 *
 * A space states its volume at most one way, in {@link cells} or in
 * {@link shell}. Stating both is refused, because two spellings of one region
 * can be edited apart and the containment query would have to pick a winner
 * nobody authored. Stating neither makes a purely semantic container that
 * locates nothing and contains no point.
 *
 * @evidence contracts/common.md#principled-implementation A region is either a union of half-space cells, each containing a point when every `dot(normal, point) <= offset + 1e-9` holds, or a closed triangle shell tested by its own boundary; both are flat-faced, so a curved region is only approximated, which `fidelity` declares rather than hides.
 * @evidence contracts/common.md#clear-and-simple-design The hierarchy is one nullable parent id, and `builtSpaceContainsPoint` is the single reader that picks cells or shell, so no consumer branches on which spelling a space used.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cells and shell together are refused instead of merged, `fidelity` on a volume-less space is refused, and `faceted` is an authored declaration that no code infers from the geometry.
 * @evidence contracts/common.md#meaningful-documentation States the one-spelling rule and the meaning of neither, the parent and root rules, the convexity and world frame of cells, when to use a shell, and what `exact`, `faceted`, and absence of `fidelity` mean for derived answers.
 * @author Samchon
 */
export interface IAutoMovieBuiltSpace {
  /** Stable logical-space identity, unique within the environment. */
  id: string;

  /**
   * Non-blank open label such as `building`, `storey`, `room`, `attic`,
   * `void`, `roof-deck`, `facade-access`, or `bridge-deck`.
   */
  kind: string;

  /**
   * Parent logical-space id, or null for a root partition; every root must be
   * some building unit's root space, and the parent chain may not cycle.
   */
  parent: string | null;

  /**
   * World-space convex cells whose union locates the region. Empty cells make a
   * purely semantic container; a non-convex region is split into cells.
   *
   * A union of convex cells states any polyhedral region exactly, however
   * concave, so this is the ordinary spelling. It cannot state a region whose
   * boundary is curved, and it states a region pierced by a void only through
   * many cells; see {@link shell} for the second and {@link fidelity} for the
   * first.
   */
  cells: IAutoMovieConvexSpaceCell[];

  /**
   * The region as its own closed triangle boundary, when half-space cells
   * would state it awkwardly.
   *
   * A storey pierced by an atrium is one shell rather than a hand
   * decomposition into cells, which IFC likewise allows through a faceted
   * B-rep with voids. A shell is authoritative for containment wherever it is
   * stated, it is mutually exclusive with {@link cells}, and it is flat-faced:
   * a dome authored here is the facets it is written as, which
   * {@link fidelity} declares.
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
