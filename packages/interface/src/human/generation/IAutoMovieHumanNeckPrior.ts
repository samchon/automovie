/** Type contracts exchanged by AutoMovieHumanNeckPrior; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanNeckPrior {
  /** One layer's ring as harmonics of its phase.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One layer's ring as harmonics of its phase.
   * @evidence contracts/development/design.md#principled-representation `x`: Forward place over the depth: cosines from the constant term. `z`: Lateral place over the width: sines from the first. `y`: Height off the ring's mean, mm: cosines from the constant term.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanNeckSource.perimeter.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `x`, `z`, `y`; callers supply the complete record.
   */
  export interface IRing {
    /** Forward place over the depth: cosines from the constant term. */
    x: readonly number[];

    /** Lateral place over the width: sines from the first. */
    z: readonly number[];

    /** Height off the ring's mean, mm: cosines from the constant term. */
    y: readonly number[];
  }

  /** A size per layer.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A size per layer.
   * @evidence contracts/development/design.md#principled-representation `level`: Log of the size over the tape read there. `sex`: Per unit of the masculine-feminine control. `gain`: Per unit of the log of the tape read there.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanNeckSource.size.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `level`, `sex`, `gain`; callers supply the complete record.
   */
  export interface ISize {
    /** Log of the size over the tape read there. */
    level: readonly number[];

    /** Per unit of the masculine-feminine control. */
    sex: readonly number[];

    /** Per unit of the log of the tape read there. */
    gain: readonly number[];
  }

  /** A place per layer.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A place per layer.
   * @evidence contracts/development/design.md#principled-representation `level`: Forward place, mm. `sex`: Per unit of the masculine-feminine control.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanNeckPrior.IPlace is the canonical exchange used by IAutoMovieHumanNeckPrior.IPrior.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `level`, `sex`; callers supply the complete record.
   */
  export interface IPlace {
    /** Forward place, mm. */
    level: readonly number[];

    /** Per unit of the masculine-feminine control. */
    sex: readonly number[];
  }

  /** The prior.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The prior.
   * @evidence contracts/development/design.md#principled-representation `order`: Control points of a section. `samples`: Uniform phases of the rings. `width`: Half width per layer, from the bottom.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanNeckPrior.PRIOR, AutoMovieHumanNeckSource.prior.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `order`, `samples`, `width`, `depth`, `place`, `drop`, `rings`; callers supply the complete record.
   */
  export interface IPrior {
    /** Control points of a section. */
    order: number;

    /** Uniform phases of the rings. */
    samples: number;

    /** Half width per layer, from the bottom. */
    width: ISize;

    /** Half depth per layer. */
    depth: ISize;

    /** Forward centre per layer. */
    place: IPlace;

    /** Mean height of each layer off the top layer's, mm. */
    drop: readonly number[];

    /** Normalized ring per layer. */
    rings: readonly IRing[];
  }
}
