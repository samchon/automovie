import type { IAutoMovieHumanJoinLoop } from "../conic/IAutoMovieHumanJoinLoop";

/**
 * The contact and search rule of the F1 armscye source.
 */
export namespace IAutoMovieHumanF1Armscye {
  /**
   * The armscye port curve and the two chart addresses at its seed.
   *
   * The legacy ring and outermost readers report the largest sampled gap and their sampled part stations.
   * A signed-field reader observes the corresponding skin division under its own source scope.
   */
  export type IContact = IAutoMovieHumanJoinLoop.IContact;

  /**
   * How the contact's station is sought at each phase of the part: about a ring of the part (`ring`, the crossing nearest it within
   * `near` mm of its course, and the ring itself where there is none), or as the last station at which the part's station line leaves
   * the host within `within` mm of the face's start (`outermost`), for a part whose course leaves the host obliquely; or where the
   * part's station line passes the dividing surface the two parts were fitted either side of (`surface`, positive on the part's side).
   * The first two read the crossing of the two fitted walls, which is the contact only where both walls are skin: fitted either side
   * of one surface, the host's wall past it and the part's before it are closures, and their crossing is nobody's curve (measured on
   * f1: it jumped between arm stations 74 and 119 over the shoulder's cap). The third reads the surface itself, where both are skin
   * (`AutoMovieHumanJoinLoop`), and is not faired: a skin cut by a smooth surface is a smooth curve.
   */
  export type IRule =
    | { type: "ring"; ring: number; near: number }
    | { type: "outermost"; within: number }
    | { type: "surface"; side: (p: readonly number[]) => number };
}
