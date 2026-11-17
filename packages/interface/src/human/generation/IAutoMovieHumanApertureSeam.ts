import type { IAutoMovieLoftChain } from "../../construction/IAutoMovieLoftChain";

/** Type contracts exchanged by AutoMovieHumanApertureSeam; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanApertureSeam {
  /** The chainOf argument of AutoMovieHumanApertureSeam.drawn. The trim loop of a slit with its points on the closing line.
  @param points The trim loop's points on their chains.
  @param seam The slit's closing line.
  @param chainOf The chain of a name.
  @param across The chain beyond an end of a chain, at a phase of its ring, through the ring they share, or null.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The trim loop of a slit with its points on the closing line.
 * @evidence contracts/development/design.md#principled-representation The trim loop of a slit with its points on the closing line. The callable takes name and returns IAutoMovieLoftChain.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanApertureSeam.DrawnChainOf is the canonical exchange used by AutoMovieHumanApertureSeam.drawn.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanApertureSeam.drawn for the trim loop of a slit with its points on the closing line.
 */
  export type DrawnChainOf = (name: string) => IAutoMovieLoftChain;

  /** The across argument of AutoMovieHumanApertureSeam.drawn. The trim loop of a slit with its points on the closing line.
  @param points The trim loop's points on their chains.
  @param seam The slit's closing line.
  @param chainOf The chain of a name.
  @param across The chain beyond an end of a chain, at a phase of its ring, through the ring they share, or null.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The trim loop of a slit with its points on the closing line.
 * @evidence contracts/development/design.md#principled-representation The trim loop of a slit with its points on the closing line. The callable takes name, end, t and returns IAutoMovieLoftChain | null.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanApertureSeam.DrawnAcross is the canonical exchange used by AutoMovieHumanApertureSeam.drawn.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanApertureSeam.drawn for the trim loop of a slit with its points on the closing line.
 */
  export type DrawnAcross = (
    name: string,
    end: "bottom" | "top",
    t: number,
  ) => IAutoMovieLoftChain | null;
}
