import { AutoMovieHumanPositivePairSolve } from "./AutoMovieHumanPositivePairSolve";

/**
 * Close breadth and convex-hull circumference on one final knuckle section.
 * The observer owns its anatomical plane and reads the actual mapped surface,
 * including movement of the metacarpal heads as either scale changes.
 */
export namespace AutoMovieHumanHandSectionSolve {
  /** Positive scales in the hand's transverse axes. */
  export interface IScale {
    /** Across-hand millimetres per source millimetre. */
    across: number;

    /** Through-hand millimetres per source millimetre. */
    through: number;
  }

  /** Measures of the same knuckle section, in millimetres. */
  export interface IMeasures {
    /** Reach along metacarpale II to V. */
    breadth: number;

    /** Convex-hull perimeter in that plane. */
    girth: number;
  }

  /**
   * Solve both independent tapes with their final-plane observer. Width and
   * thickness move together because either changes the same hull perimeter.
   * A closed planar hull has perimeter greater than twice any positive breadth.
   */
  export function solve(wanted: IMeasures, initial: IScale, observe: (scale: IScale) => IMeasures): IScale {
    if (!(wanted.girth > 2 * wanted.breadth))
      throw new Error("Hand section perimeter must exceed twice its breadth");
    const scales: AutoMovieHumanPositivePairSolve.Pair = AutoMovieHumanPositivePairSolve.solve(
      [wanted.breadth, wanted.girth],
      [initial.across, initial.through],
      ([across, through]: AutoMovieHumanPositivePairSolve.Pair): AutoMovieHumanPositivePairSolve.Pair => {
        const measured: IMeasures = observe({ across, through });
        return [measured.breadth, measured.girth];
      },
    );
    return { across: scales[0], through: scales[1] };
  }
}
