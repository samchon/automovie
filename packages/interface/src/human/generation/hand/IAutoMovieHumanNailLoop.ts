/**
 * The paired chart addresses and outline controls of a digit nail.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The paired chart addresses and outline controls of a digit nail.
 * @evidence contracts/development/design.md#principled-representation The loop carries station millimetres, phase radians and a dimensionless per-clock share.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanNailLoop builds the loop on the nail plate and digit skin from their original readers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each start address retains its own chart.
 */
export namespace IAutoMovieHumanNailLoop {
  /**
   * A nail's chart loop and its paired starting addresses on digit and plate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A nail's chart loop and its paired starting addresses on digit and plate.
   * @evidence contracts/development/design.md#principled-representation The centre and semi-axes use station millimetres and phase radians. The shape array stores shares in the loop clock. Valid chart domains are a producer premise.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanNailLoop derives the boundary with the nail's family and the digit's existing skin reader, for inspection and joint evidence.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The paired start addresses remain distinct since each lies in its own part's chart.
   */
  export interface ILoop {
    /** The chart ellipse's centre `[station, phase]` on the digit. */
    centre: [number, number];

    /** Its semi-axes `[station, phase]`. */
    semi: [number, number];

    /** The curve's share of the ellipse at each column's clock. */
    shape: number[];

    /** The plate's chart point `[station, phase]` on the curve at clock 0. */
    part: [number, number];

    /** The digit's chart point `[station, phase]` on the curve at clock 0. */
    host: [number, number];
  }
}
