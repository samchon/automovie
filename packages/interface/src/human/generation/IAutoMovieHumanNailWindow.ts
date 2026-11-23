/** A nail plate's window on its digit chain. */
export interface IAutoMovieHumanNailWindow {
  /** Digit chain the plate lies on, e.g. `finger.left.index`. */
  chain: string;

  /** Chain station of the plate's root (the cuticle), mm. */
  root: number;

  /** Chain station of the plate's free edge, mm. */
  edge: number;

  /** Width of the plate edge to edge, mm. */
  width: number;

  /** Unit dorsal direction at the root: the side of the chain the plate lies on. */
  dorsal: [number, number, number];
}
