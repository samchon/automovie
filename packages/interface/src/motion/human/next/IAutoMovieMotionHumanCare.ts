import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * Authoring parameters for caring for another person: first aid on a lying or
 * seated partner.
 *
 * Compressions follow the American Heart Association 2020 adult guideline: 100
 * to 120 a minute, 30 compressions to 2 breaths, both palms on the partner's
 * lower sternum, one hand over the other, the arms straight. A pulse is felt
 * for 10 s, the check of AHA 2020 basic life support. The owning constants are
 * `AutoMovieMotionHumanCare.COMPRESSION_CYCLE` and `PULSE_HOLD`.
 */
/** The authorable input types for care operations. */
export namespace IAutoMovieMotionHumanCare {
  /** Where a pulse is felt: the carotid at the neck or the radial at the wrist. */
  export type IPulseSite = "carotid" | "radial";

  /** The parameters of `kneelBeside`. */
  export interface IKneelBeside {
    /** The floor point beside the partner the right knee comes down on. */
    at: IAutoMovieMotionTarget;
  }

  /** The parameters of `compressions`. */
  export interface ICompressions {
    /** The partner's subject. */
    partner: string;
  }

  /** The parameters of `pulse`. */
  export interface IPulse {
    /** The partner's subject. */
    partner: string;

    /** The carotid or the radial pulse. */
    site: IPulseSite;

    /** The feeling hand; the right when absent. */
    side?: AutoMovieHumanSide;
  }

  /** The parameters of `pressWound`. */
  export interface IPressWound {
    /** The partner's subject. */
    partner: string;

    /** The wounded region. */
    region: AutoMovieHumanoidRegion;

    /** Seconds the pressure is held. */
    hold: number;
  }
}
