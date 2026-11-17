import type { IAutoMovieLoftChain } from "../../construction/IAutoMovieLoftChain";

/**
 * Named-chain lookup and cross-end traversal used to close a slit trim loop.
 *
 * The interface package owns these declarations; AutoMovieHumanApertureSeam in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Named-chain lookup and cross-end traversal used to close a slit trim loop. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only DrawnChainOf, DrawnAcross declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation DrawnChainOf, DrawnAcross separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanApertureSeam exchanges the named DrawnChainOf, DrawnAcross contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
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
