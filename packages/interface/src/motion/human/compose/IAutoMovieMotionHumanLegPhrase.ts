import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionWeaponPath } from "../law/IAutoMovieMotionWeaponPath";
import type { IAutoMovieMotionHumanFoot } from "../posture/IAutoMovieMotionHumanFoot";
import type { IAutoMovieMotionClock } from "./IAutoMovieMotionClock";
import type { IAutoMovieMotionHumanLeg } from "./IAutoMovieMotionHumanLeg";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";

/**
 * Leg phrases: one foot leaving and rejoining its stance on one clock, a lift,
 * a tap, a swing and a pivot, each built on the leg's own movement
 * (`AutoMovieMotionHumanLeg.place`) and its swing path
 * (`AutoMovieMotionHumanLeg.arc`).
 */
export namespace IAutoMovieMotionHumanLegPhrase {
  /**
   * What every leg phrase takes: the leg, the clock whose standard instants
   * (`AutoMovieMotionClock.PHRASE`) it moves on, and where the foot stands
   * before and after.
   */
  export interface IPhrase {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** A clock with the standard instants of a phrase. */
    clock: IAutoMovieMotionClock;

    /** The leg. */
    side: AutoMovieHumanSide;

    /** Where the foot stands before and after the phrase. */
    stance: IAutoMovieMotionHumanFoot.IPlacement;

    /**
     * What the foot bears on while it is on its place, when the place is solid;
     * absent for a place in the air, which gives no contact window.
     */
    contact?: Pick<IAutoMovieMotionHumanContactWindow, "kind" | "support">;

    /**
     * The manner's size: the extent scales a place in the air about where the
     * foot leaves from. A phrase that states a contact keeps its place whatever
     * the extent. Neutral when absent.
     */
    manner?: Pick<IAutoMovieMotionManner.IModifiers, "extent">;
  }

  /**
   * A lift: the foot leaves its stance, is held raised and is set back (a knee
   * raised, a foot drawn up, a leg crossed). It travels from `start` to
   * `stroke`, stays until `relax` and stands again at `end`. Input props of
   * AutoMovieMotionHumanLegPhrase.lift. The phrase and the raised placement.
   */
  export type ILiftProps = IAutoMovieMotionHumanLegPhrase.IPhrase & {
    /**
     * Retained callback for the lifted foot's target frame, evaluated on the
     * phrase's action-relative clock.
     */
    raised: IAutoMovieMotionHumanLeg.Frame;
  };

  /**
   * A tap: the foot swings to a place on an arc, rests on it and swings back (a
   * toe tapped ahead, a foot set on a step and taken off). It lands at
   * `stroke`, stays until `relax` and stands on its stance again at `end`.
   * Input props of AutoMovieMotionHumanLegPhrase.tap. The phrase, the place and
   * the ankle's greatest rise on the way, metres.
   */
  export type ITapProps = IAutoMovieMotionHumanLegPhrase.IPhrase & {
    /**
     * Retained callback for the foot's tapping target frame on the phrase
     * clock.
     */
    target: IAutoMovieMotionHumanLeg.Frame;
    /** Maximum added ankle lift above the interpolated travel baseline, metres. */
    clearance: number;
  };

  /**
   * A swing: the foot is drawn to a chamber by `ready`, extends from
   * `strokeStart` and passes its target at `stroke` at speed. With a follow
   * phase it travels on past the target and slows to rest at `strokeEnd` (a
   * kick in the air); with none it is arrested at the target (a kick met by a
   * body). It stays until `relax` and stands on its stance again at `end`.
   * Input props of AutoMovieMotionHumanLegPhrase.swing. The phrase, the
   * chamber, the target and the weapons the swing carries.
   */
  export type ISwingProps = IAutoMovieMotionHumanLegPhrase.IPhrase & {
    /** Retained callback for the prepared leg target frame. */
    chamber: IAutoMovieMotionHumanLeg.Frame;
    /** Retained callback for the leg's strike target frame. */
    target: IAutoMovieMotionHumanLeg.Frame;
    /**
     * Borrowed weapon declarations carried through the swing; omitted means
     * none.
     */
    weapons?: readonly IAutoMovieMotionWeaponPath[];
  };

  /**
   * A pivot: the foot turns about a sole point that stays on the floor and
   * turns back (the rear foot of a punch on its ball, the support foot of a
   * round kick, a heel turned out). The turn and the pitch grow from `start` to
   * `stroke`, stay until `relax` and are gone at `end`. Input props of
   * AutoMovieMotionHumanLegPhrase.pivot. The phrase, the sole point that stays,
   * the heading's turn at its fullest in degrees about +Y and the pitch at its
   * fullest in degrees, positive toes up.
   */
  export type IPivotProps = Omit<
    IAutoMovieMotionHumanLegPhrase.IPhrase,
    "contact"
  > & {
    /** Foot contact point kept planted during the pivot. */
    about: "heel" | "ball";
    /** Yaw added by the pivot, degrees about world +Y. */
    turn: number;
    /** Foot pitch at the pivot's fullest, degrees, positive toes up. */
    pitch: number;
  };
}
