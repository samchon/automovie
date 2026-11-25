import type { IAutoMovieArcLengthJet } from "../../geometry/IAutoMovieArcLengthJet";

/**
 * Section-sector phase jets and landmark-guide arc-length jets for trunk ring
 * assembly.
 *
 * The interface package owns these declarations; AutoMovieHumanTrunkAssembly in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanTrunkAssembly {
  /** A sector's jet at a phase: point, first and second derivatives per radian. */
  export type Sector = (t: number) => [number[], number[], number[]];

  /** A guide of the left side. */
  export interface IGuide {
    /** Knot of the 256-control section. */
    knot: number;

    /** The guide's jet in the section plane `[x, z]`, by arclength. */
    jet: IAutoMovieArcLengthJet;

    /** Parameter speed at the guide, mm per radian of phase. */
    speed: number;
  }
}
