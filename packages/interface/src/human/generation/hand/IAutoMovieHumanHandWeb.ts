import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Parent-ring phase arcs and point/direction readers used to construct
 * digit-root web margins.
 *
 * The interface package owns these declarations; AutoMovieHumanHandWeb in Human
 * supplies their runtime values.
 */
export namespace IAutoMovieHumanHandWeb {
  /**
   * The arcs argument of AutoMovieHumanHandWeb.rootOf. A digit's first ring at
   * its web: its arcs of the parent's ring, closed by bridges.
   */
  export type RootOfArcs = readonly [number, number][];

  /**
   * The read argument of AutoMovieHumanHandWeb.rootOf. A digit's first ring at
   * its web: its arcs of the parent's ring, closed by bridges.
   */
  export type RootOfRead = (t: number) => AutoMovieVector3Tuple;

  /**
   * The ring argument of AutoMovieHumanHandWeb.crestOf. A web's crest in the
   * form, as the surface builds it: a round margin half its pinches' chord past
   * their middle, along the parent's own surface there.
   */
  export type CrestOfRing = (t: number) => AutoMovieVector3Tuple;

  /**
   * The outward argument of AutoMovieHumanHandWeb.crestOf. A web's crest in the
   * form, as the surface builds it: a round margin half its pinches' chord past
   * their middle, along the parent's own surface there.
   */
  export type CrestOfOutward = (t: number) => AutoMovieVector3Tuple;

  /**
   * The ring argument of AutoMovieHumanHandWeb.arcPoints. A child's arcs of its
   * parent's ring, sampled, each to stand behind its first section.
   */
  export type ArcPointsRing = (t: number) => AutoMovieVector3Tuple;

  /**
   * The arcs argument of AutoMovieHumanHandWeb.arcPoints. A child's arcs of its
   * parent's ring, sampled, each to stand behind its first section.
   */
  export type ArcPointsArcs = readonly [number, number][];
}
