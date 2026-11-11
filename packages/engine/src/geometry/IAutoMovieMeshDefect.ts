/**
 * One topological or shape defect of a triangle mesh, located by the vertices that carry it, as `measureAutoMovieMeshDefects` lists them.
 *
 * A defect is either an edge between two welded corners or one whole triangle, and `kind` says which. Vertex indices address the measured position buffer as the mesh itself names its corners, before welding, so a consumer can read the positions back without repeating the weld.
 *
 * @evidence contracts/development/design.md#principled-representation Represents one defect of a triangle complex as its kind plus the vertices of its simplex: an edge's two ends or a triangle's three corners. Indices are unitless counts into the measured position buffer. The length of `vertices` follows from `kind` and is not encoded in the type, so a record with the wrong length is ruled out only by its producer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the engine's geometry module beside its producer `measureAutoMovieMeshDefects`. The viewer's inspection instrument reads both members: `kind` selects the colour, the legend entry and the request's filter, and `vertices` gives the segment or triangle to draw.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Edge and triangle defects share one flat record instead of a union discriminated by arity, because every consumer draws `vertices` as one index run whatever its length; the cost is the unenforced length stated above. No member is optional, no type is widened, and the counts of `IAutoMovieMeshTopology` are not repeated here.
 * @evidence contracts/development/common.md#meaningful-documentation States what a defect locates, which buffer the vertex indices address and that they are unwelded, and the length and order of the list per kind.
 */
export interface IAutoMovieMeshDefect {
  /** Which defect this is. */
  kind: IAutoMovieMeshDefect.Kind;

  /**
   * Vertex indices into the measured position buffer: two for an edge kind, three for a triangle kind.
   *
   * An edge's pair is the original, unwelded indices of its two ends in the order its first using triangle traverses them. A triangle's three are its own corners in their stored order.
   */
  vertices: number[];
}
export namespace IAutoMovieMeshDefect {
  /**
   * The defect classes `measureAutoMovieMeshDefects` tells apart.
   *
   * `open`, `non-manifold` and `inconsistent` are edge kinds: an edge between two welded corners used by exactly one triangle, by more than two, or by exactly two that traverse it in the same direction. `degenerate` and `sliver` are triangle kinds: a triangle whose corners weld onto fewer than three lattice cells, or a triangle on three distinct cells whose aspect exceeds the caller's limit.
   *
   * @evidence contracts/development/design.md#principled-representation A closed union of the five classes the edge census and the triangle tests can produce, so a consumer's switch over it is exhaustive and no other string can be written.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned with `IAutoMovieMeshDefect`; the producer writes each literal and the viewer's inspection instrument maps each to a colour and a legend entry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The union does not split edge kinds from triangle kinds into two types, since its consumers handle both through the one record; which kinds are which is stated here instead.
   * @evidence contracts/development/common.md#meaningful-documentation Defines each literal by its incidence or shape condition and says which are edge kinds and which are triangle kinds.
   */
  export type Kind =
    | "open"
    | "non-manifold"
    | "inconsistent"
    | "degenerate"
    | "sliver";
}
