import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanHandWeb; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHandWeb {
  /** The arcs argument of AutoMovieHumanHandWeb.rootOf. A digit's first ring at its web: its arcs of the parent's ring, closed by bridges.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A digit's first ring at its web: its arcs of the parent's ring, closed by bridges.
   * @evidence contracts/development/design.md#principled-representation A digit's first ring at its web: its arcs of the parent's ring, closed by bridges. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandWeb.RootOfArcs is the canonical exchange used by AutoMovieHumanHandWeb.rootOf.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHandWeb.rootOf for a digit's first ring at its web: its arcs of the parent's ring, closed by bridges.
   */
  export type RootOfArcs = readonly [number, number][];

  /** The read argument of AutoMovieHumanHandWeb.rootOf. A digit's first ring at its web: its arcs of the parent's ring, closed by bridges.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A digit's first ring at its web: its arcs of the parent's ring, closed by bridges.
   * @evidence contracts/development/design.md#principled-representation A digit's first ring at its web: its arcs of the parent's ring, closed by bridges. The callable takes t and returns AutoMovieVector3Tuple.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandWeb.RootOfRead is the canonical exchange used by AutoMovieHumanHandWeb.rootOf.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHandWeb.rootOf for a digit's first ring at its web: its arcs of the parent's ring, closed by bridges.
   */
  export type RootOfRead = (t: number) => AutoMovieVector3Tuple;

  /** The ring argument of AutoMovieHumanHandWeb.crestOf. A web's crest in the form, as the surface builds it: a round margin half its
  pinches' chord past their middle, along the parent's own surface there.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A web's crest in the form, as the surface builds it: a round margin half its pinches' chord past their middle, along the parent's own surface there.
 * @evidence contracts/development/design.md#principled-representation A web's crest in the form, as the surface builds it: a round margin half its pinches' chord past their middle, along the parent's own surface there. The callable takes t and returns AutoMovieVector3Tuple.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandWeb.CrestOfRing is the canonical exchange used by AutoMovieHumanHandWeb.crestOf.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHandWeb.crestOf for a web's crest in the form, as the surface builds it: a round margin half its pinches' chord past their middle, along the parent's own surface there.
 */
  export type CrestOfRing = (t: number) => AutoMovieVector3Tuple;

  /** The outward argument of AutoMovieHumanHandWeb.crestOf. A web's crest in the form, as the surface builds it: a round margin half its
  pinches' chord past their middle, along the parent's own surface there.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A web's crest in the form, as the surface builds it: a round margin half its pinches' chord past their middle, along the parent's own surface there.
 * @evidence contracts/development/design.md#principled-representation A web's crest in the form, as the surface builds it: a round margin half its pinches' chord past their middle, along the parent's own surface there. The callable takes t and returns AutoMovieVector3Tuple.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandWeb.CrestOfOutward is the canonical exchange used by AutoMovieHumanHandWeb.crestOf.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHandWeb.crestOf for a web's crest in the form, as the surface builds it: a round margin half its pinches' chord past their middle, along the parent's own surface there.
 */
  export type CrestOfOutward = (t: number) => AutoMovieVector3Tuple;

  /** The ring argument of AutoMovieHumanHandWeb.arcPoints. A child's arcs of its parent's ring, sampled, each to stand behind its first section.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A child's arcs of its parent's ring, sampled, each to stand behind its first section.
   * @evidence contracts/development/design.md#principled-representation A child's arcs of its parent's ring, sampled, each to stand behind its first section. The callable takes t and returns AutoMovieVector3Tuple.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandWeb.ArcPointsRing is the canonical exchange used by AutoMovieHumanHandWeb.arcPoints.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHandWeb.arcPoints for a child's arcs of its parent's ring, sampled, each to stand behind its first section.
   */
  export type ArcPointsRing = (t: number) => AutoMovieVector3Tuple;

  /** The arcs argument of AutoMovieHumanHandWeb.arcPoints. A child's arcs of its parent's ring, sampled, each to stand behind its first section.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A child's arcs of its parent's ring, sampled, each to stand behind its first section.
   * @evidence contracts/development/design.md#principled-representation A child's arcs of its parent's ring, sampled, each to stand behind its first section. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandWeb.ArcPointsArcs is the canonical exchange used by AutoMovieHumanHandWeb.arcPoints.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHandWeb.arcPoints for a child's arcs of its parent's ring, sampled, each to stand behind its first section.
   */
  export type ArcPointsArcs = readonly [number, number][];
}
