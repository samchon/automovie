import type { IAutoMovieArcLengthJet } from "../geometry/IAutoMovieArcLengthJet";

/**
 * Section-phase jets and guide constraints used to derive seam knot controls.
 *
 * The interface package owns these declarations; AutoMovieHumanSeamKnot in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanSeamKnot {
  /**
   * A section point with its first and second phase derivatives, `[p, p',
   * p'']`.
   */
  export type Jet = [number[], number[], number[]];

  /** A guide: a knot owned by a longitudinal landmark curve. */
  export interface IGuide {
    /** Knot index in `[0, N)`. */
    knot: number;

    /** The guide's published jet in section coordinates. */
    jet: IAutoMovieArcLengthJet;

    /** Parameter speed at the guide, mm per radian of phase. */
    speed: number;

    /** Tangential acceleration, mm per radian squared; absent means 0. */
    acceleration?: number;
  }

  /**
   * A sector between consecutive guides: its own curve over the phases of its
   * span, in section coordinates.
   */
  export interface ISector {
    /** Name in errors. */
    name: string;

    /** The sector's jet at a phase of its own knots, per radian. */
    jet: (t: number) => Jet;
  }

  /**
   * Result of AutoMovieHumanSeamKnot.controls. The three control points `[P-,
   * P0, P+]` that give a knot a jet: the inverse of {@link knot}.
   */
  export type ControlsResult = [number[], number[], number[]];
}
