/**
 * Layered neck-ring harmonics and size/place regressions in their declared
 * calibration scales.
 *
 * The interface package owns these declarations; AutoMovieHumanNeckPrior in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanNeckPrior {
  /** One layer's ring as harmonics of its phase. */
  export interface IRing {
    /** Forward place over the depth: cosines from the constant term. */
    x: readonly number[];

    /** Lateral place over the width: sines from the first. */
    z: readonly number[];

    /** Height off the ring's mean, mm: cosines from the constant term. */
    y: readonly number[];
  }

  /** A size per layer. */
  export interface ISize {
    /** Log of the size over the tape read there. */
    level: readonly number[];

    /** Per unit of the masculine-feminine control. */
    sex: readonly number[];

    /** Per unit of the log of the tape read there. */
    gain: readonly number[];
  }

  /** A place per layer. */
  export interface IPlace {
    /** Forward place, mm. */
    level: readonly number[];

    /** Per unit of the masculine-feminine control. */
    sex: readonly number[];
  }

  /** The prior. */
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
