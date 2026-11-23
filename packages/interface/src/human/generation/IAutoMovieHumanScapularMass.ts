import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanTrunkReliefNet } from "./IAutoMovieHumanTrunkReliefNet";

/**
 * Type contracts exchanged by AutoMovieHumanScapularMass; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanScapularMass {
  /** What the mass reads. */
  export interface IInput {
    /** The back wall's point at the centre's lateral place, `[x, y, z]`, mm. */
    centre: AutoMovieVector3Tuple;

    /**
     * The wall's section tangent there in `[x, z]`, in the direction of rising
     * phase (back: z falling).
     */
    tangent: [number, number];

    /** The section's half width at the centre's height, mm. */
    width: number;

    /** The crotch-to-cervicale span, mm. */
    span: number;

    /** The base's phase at a lateral place on the back at the centre's height. */
    phaseOf: (z: number) => number;

    /** The trunk's base surface. */
    base: IAutoMovieHumanTrunkReliefNet.Base;

    /**
     * Height the window must stay under, mm: the shoulders' top less a
     * clearance.
     */
    ceiling: number;
  }
}
