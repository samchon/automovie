import type { IAutoMovieLoftChain } from "../construction/IAutoMovieLoftChain";

/**
 * Named-chain lookup and cross-end traversal used to close a slit trim loop.
 *
 * The interface package owns these declarations; AutoMovieHumanApertureSeam in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanApertureSeam {
  /**
   * The chainOf argument of AutoMovieHumanApertureSeam.drawn. The trim loop of
   * a slit with its points on the closing line.
   *
   * @param points The trim loop's points on their chains.
   * @param seam The slit's closing line.
   * @param chainOf The chain of a name.
   * @param across The chain beyond an end of a chain, at a phase of its ring,
   *   through the ring they share, or null.
   */
  export type DrawnChainOf = (name: string) => IAutoMovieLoftChain;

  /**
   * The across argument of AutoMovieHumanApertureSeam.drawn. The trim loop of a
   * slit with its points on the closing line.
   *
   * @param points The trim loop's points on their chains.
   * @param seam The slit's closing line.
   * @param chainOf The chain of a name.
   * @param across The chain beyond an end of a chain, at a phase of its ring,
   *   through the ring they share, or null.
   */
  export type DrawnAcross = (
    name: string,
    end: "bottom" | "top",
    t: number,
  ) => IAutoMovieLoftChain | null;
}
