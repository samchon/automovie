import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Authoring inputs and presets for dressing another performer.
 */
export namespace IAutoMovieMotionHumanGetDressed {
  /** The parameters of `straightenPartnerTie`. */
  export interface IStraightenPartnerTie {
    /** The partner's subject whose tie is straightened. */
    partner: string;

    /** The smoothing hand. */
    side: AutoMovieHumanSide;
  }

  /** The parameters of `adjustCuff`. */
  export interface IAdjustCuff {
    /** The side of the sleeve being adjusted. */
    cuff: AutoMovieHumanSide;
  }
}
