import { AutoMovieHumanHairStyle } from "../typings/AutoMovieHumanHairStyle";

/**
 * How a style's strand follows its direction field, falls and stacks, per
 * integration step of the kinematic sweep (`AutoMovieHumanHairGuide`). All
 * values are conventions of this prototype, not measurements: short hair
 * stands in its field, long hair falls.
 */
export namespace AutoMovieHumanHairStrandDynamics {
  /** The three coefficients of one style. */
  export interface ICoefficients {
    /** Share of the way to the field's direction a step turns, per step. */
    adherence: number;

    /** Share of the downward direction a step turns by, at the strand's end. */
    gravity: number;

    /**
     * Clearance growth per millimetre grown: later hair stacks over earlier
     * hair, giving the cut its volume.
     */
    stack: number;
  }

  /**
   * A style's strand coefficients (conventions).
   *
   * @param style Haircut
   * @returns Adherence, gravity and stacking
   */
  export function coefficients(style: AutoMovieHumanHairStyle): ICoefficients {
    if (style === AutoMovieHumanHairStyle.Crop)
      return { adherence: 0.5, gravity: 0.02, stack: 0.03 };
    if (style === AutoMovieHumanHairStyle.Short)
      return { adherence: 0.4, gravity: 0.1, stack: 0.07 };
    return { adherence: 0.25, gravity: 0.45, stack: 0.04 };
  }
}
