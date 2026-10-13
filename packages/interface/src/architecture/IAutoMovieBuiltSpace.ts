import { IAutoMovieConvexSpaceCell } from "./IAutoMovieConvexSpaceCell";
import { IAutoMovieSpaceShell } from "./IAutoMovieSpaceShell";

/**
 * One named semantic region, independent of visible walls and slabs.
 *
 * **A space states its volume exactly one way**, in {@link cells} or in
 * {@link shell}, and stating both is refused for the same reason a support patch
 * may not state its ground twice: two spellings of one region are two regions
 * waiting to be edited apart, and the containment query would have to pick a
 * winner nobody authored. Stating neither is the third legitimate case, a
 * purely semantic container that locates nothing.
 *
 * @evidence contracts/common.md#principled-implementation A region is a union of convex half-space cells of four or more planes, or one closed triangle shell; validation refuses both at once, a shell with an unmatched or repeated directed edge, and a shell whose signed volume is not positive.
 * @evidence contracts/common.md#clear-and-simple-design Cells stay the ordinary spelling and the shell is an alternative only for pierced or many-faced regions, while `fidelity` is a declared flag rather than a computed property with its own geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A faceted region is never presented as the curve it approximates, `fidelity` is refused on a space that states no volume, and nothing attempts to detect intended curvature from flats.
 * @evidence contracts/common.md#meaningful-documentation States the one-spelling rule, the semantic-container case, the shell's authority for containment, root and parent rules, and what `faceted` obliges derived quantities to say.
 */
export interface IAutoMovieBuiltSpace {
  /** Stable logical-space identity. */
  id: string;

  /**
   * Open semantic label such as `building`, `storey`, `room`, `attic`, `void`,
   * `roof-deck`, `facade-access`, or `bridge-deck`.
   */
  kind: string;

  /**
   * Parent logical-space id, or null for a root partition; every root must be
   * some building unit's root space, and the parent chain may not cycle.
   */
  parent: string | null;

  /**
   * World-space convex cells whose union locates the region. Empty cells make a
   * purely semantic container; non-convex regions are split into cells.
   *
   * A union of convex cells says every polyhedral region exactly, however
   * concave, so this stays the ordinary spelling. What it cannot say is a
   * region whose boundary is not flat, and what it says awkwardly is a region
   * pierced by a void: see {@link shell} for the first and
   * {@link IAutoMovieBuiltSpace.fidelity} for what a faceted approximation owes
   * the reader.
   */
  cells: IAutoMovieConvexSpaceCell[];

  /**
   * The region as its own closed boundary, when half-spaces cannot state it.
   *
   * This is the escape hatch IFC keeps open and this record did not have: a
   * space's body may be a swept solid or a clipping, and `Brep` is always
   * available as the fallback advanced representation, with
   * `IfcFacetedBrepWithVoids` for the pierced case. An atrium void through a
   * storey is not an exotic shape in that standard, it is a base assumption,
   * and decomposing one into half-space cells is a chore that produces a
   * different region every time somebody does it.
   *
   * A shell is authoritative for containment wherever it is stated. It is
   * mutually exclusive with {@link cells}, and it is flats: a dome authored here
   * is the facets it is written as, which is what
   * {@link IAutoMovieBuiltSpace.fidelity} exists to say out loud.
   */
  shell?: IAutoMovieSpaceShell;

  /**
   * What the stated volume claims to be, when it claims less than the region.
   *
   * Absent, or `exact`, says the cells or the shell **are** the region: a
   * rectilinear room, a chamfered lobby, a slab with a rectangular void. There
   * is nothing left over.
   *
   * `faceted` says they only stand in for it. A dome, a barrel vault, and a
   * free-form soffit have curved boundaries, and this record carries no curved
   * primitive at all — no sweep, no surface of revolution, no NURBS — so the
   * only thing an author can write is flats, and the only honest thing the data
   * can do is say that is what they are. Every derived quantity, section and
   * containment answer over such a space is the facets' answer and not the
   * curve's; a take-off says so, rather than reporting a number to the
   * millimetre against a boundary nobody stated.
   *
   * It is a declaration, not a measurement: nothing here can look at flats and
   * tell whether a curve was meant. Declaring it on a space that states no
   * volume at all is refused, because there is nothing for it to be an
   * approximation of.
   */
  fidelity?: "exact" | "faceted";
}
