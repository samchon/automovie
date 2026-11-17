import type { IAutoMovieMotionClock } from "./IAutoMovieMotionClock";
import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionHumanFoot } from "../posture/IAutoMovieMotionHumanFoot";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanLeg } from "./IAutoMovieMotionHumanLeg";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";

/**
 * Leg phrases: one foot leaving and rejoining its stance on one clock, a
 * lift, a tap, a swing and a pivot, each built on the leg's own movement
 * (`AutoMovieMotionHumanLeg.place`) and its swing path
 * (`AutoMovieMotionHumanLeg.arc`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation contact: What the foot bears on while it is on its place, when the place is solid; absent for a place in the air, which gives no contact window. manner: The manner's size: the extent scales a place in the air about where the foot leaves from. A phrase that states a contact keeps its place whatever the extent. Neutral when absent. target: Retained callback for the foot's tapping target frame on the phrase clock.
 * @evidence contracts/development/design.md#principled-representation contact: What the foot bears on while it is on its place, when the place is solid; absent for a place in the air, which gives no contact window. manner: The manner's size: the extent scales a place in the air about where the foot leaves from. A phrase that states a contact keeps its place whatever the extent. Neutral when absent. target: Retained callback for the foot's tapping target frame on the phrase clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanLegPhrase.ts (AutoMovieMotionHumanLegPhrase.extended, props); compose/AutoMovieMotionHumanLegPhrase.ts (AutoMovieMotionHumanLegPhrase.bearing, props); compose/AutoMovieMotionHumanLegPhrase.ts (AutoMovieMotionHumanLegPhrase.cleared, props); compose/AutoMovieMotionHumanLegPhrase.ts (AutoMovieMotionHumanLegPhrase.lift, props); compose/AutoMovieMotionHumanLegPhrase.ts (AutoMovieMotionHumanLegPhrase.tap, props); compose/AutoMovieMotionHumanLegPhrase.ts (AutoMovieMotionHumanLegPhrase.swing, props).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionClock.IClock, IAutoMovieMotionHumanHand.Side, IAutoMovieMotionHumanFoot.IPlacement, IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanLegPhrase {
  /**
   * What every leg phrase takes: the leg, the clock whose standard instants
   * (`AutoMovieMotionClock.PHRASE`) it moves on, and where the foot stands
   * before and after.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member gives its meaning, and the optional two what their absence means.
   * @evidence contracts/development/design.md#principled-representation A leg phrase is one foot leaving and rejoining one stance on one clock; the contact states that the place is solid by naming what the foot bears on, so a place in the air cannot carry a contact window.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members shared by `lift`, `tap`, `swing` and `pivot`, mirroring the arm's phrase; the placement, the clock, the contact window and the modifiers are their owners' types. The exported lift, tap, swing and pivot factories read these fields to construct leg primitives.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact is one optional record instead of a solid flag beside optional contact fields; `pivot` omits it because its contact is always the ground.
   */
  export interface IPhrase {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** A clock with the standard instants of a phrase. */
    clock: IAutoMovieMotionClock.IClock;

    /** The leg. */
    side: IAutoMovieMotionHumanHand.Side;

    /** Where the foot stands before and after the phrase. */
    stance: IAutoMovieMotionHumanFoot.IPlacement;

    /**
     * What the foot bears on while it is on its place, when the place is
     * solid; absent for a place in the air, which gives no contact window.
     */
    contact?: Pick<IAutoMovieMotionHumanContactWindow, "kind" | "support">;

    /**
     * The manner's size: the extent scales a place in the air about where
     * the foot leaves from. A phrase that states a contact keeps its place
     * whatever the extent. Neutral when absent.
     */
    manner?: Pick<IAutoMovieMotionManner.IModifiers, "extent">;
  }

  /**
   * A lift: the foot leaves its stance, is held raised and is set back (a knee raised, a foot drawn up, a leg crossed). It travels from `start` to `stroke`, stays until `relax` and stands again at `end`. Input props of AutoMovieMotionHumanLegPhrase.lift. The phrase and the raised placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation raised: Retained callback for the lifted foot's target frame, evaluated on the phrase's action-relative clock.
   * @evidence contracts/development/design.md#principled-representation raised: Retained callback for the lifted foot's target frame, evaluated on the phrase's action-relative clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanLegPhrase.ts (AutoMovieMotionHumanLegPhrase.lift, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanLegPhrase.IPhrase, IAutoMovieMotionHumanLeg.Frame identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type ILiftProps = IAutoMovieMotionHumanLegPhrase.IPhrase & {
    /** Retained callback for the lifted foot's target frame, evaluated on the phrase's action-relative clock. */
    raised: IAutoMovieMotionHumanLeg.Frame;
  };

  /**
   * A tap: the foot swings to a place on an arc, rests on it and swings back (a toe tapped ahead, a foot set on a step and taken off). It lands at `stroke`, stays until `relax` and stands on its stance again at `end`. Input props of AutoMovieMotionHumanLegPhrase.tap. The phrase, the place and the ankle's greatest rise on the way, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation target: Retained callback for the foot's tapping target frame on the phrase clock. clearance: Maximum added ankle lift above the interpolated travel baseline, metres.
   * @evidence contracts/development/design.md#principled-representation target: Retained callback for the foot's tapping target frame on the phrase clock. clearance: Maximum added ankle lift above the interpolated travel baseline, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanLegPhrase.ts (AutoMovieMotionHumanLegPhrase.tap, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanLegPhrase.IPhrase, IAutoMovieMotionHumanLeg.Frame identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type ITapProps = IAutoMovieMotionHumanLegPhrase.IPhrase & {
    /** Retained callback for the foot's tapping target frame on the phrase clock. */
    target: IAutoMovieMotionHumanLeg.Frame;
    /** Maximum added ankle lift above the interpolated travel baseline, metres. */
    clearance: number;
  };

  /**
   * A swing: the foot is drawn to a chamber by `ready`, extends from `strokeStart` and passes its target at `stroke` at speed. With a follow phase it travels on past the target and slows to rest at `strokeEnd` (a kick in the air); with none it is arrested at the target (a kick met by a body). It stays until `relax` and stands on its stance again at `end`. Input props of AutoMovieMotionHumanLegPhrase.swing. The phrase, the chamber, the target and the weapons the swing carries.
   *
   * @evidence contracts/development/common.md#meaningful-documentation chamber: Retained callback for the prepared leg target frame. target: Retained callback for the leg's strike target frame. weapons: Borrowed weapon declarations carried through the swing; omitted means none.
   * @evidence contracts/development/design.md#principled-representation chamber: Retained callback for the prepared leg target frame. target: Retained callback for the leg's strike target frame. weapons: Borrowed weapon declarations carried through the swing; omitted means none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanLegPhrase.ts (AutoMovieMotionHumanLegPhrase.swing, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanLegPhrase.IPhrase, IAutoMovieMotionHumanLeg.Frame, IAutoMovieMotionHumanActionPlan.IWeapon identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type ISwingProps = IAutoMovieMotionHumanLegPhrase.IPhrase & {
    /** Retained callback for the prepared leg target frame. */
    chamber: IAutoMovieMotionHumanLeg.Frame;
    /** Retained callback for the leg's strike target frame. */
    target: IAutoMovieMotionHumanLeg.Frame;
    /** Borrowed weapon declarations carried through the swing; omitted means none. */
    weapons?: readonly IAutoMovieMotionHumanActionPlan.IWeapon[];
  };

  /**
   * A pivot: the foot turns about a sole point that stays on the floor and turns back (the rear foot of a punch on its ball, the support foot of a round kick, a heel turned out). The turn and the pitch grow from `start` to `stroke`, stay until `relax` and are gone at `end`. Input props of AutoMovieMotionHumanLegPhrase.pivot. The phrase, the sole point that stays, the heading's turn at its fullest in degrees about +Y and the pitch at its fullest in degrees, positive toes up.
   *
   * @evidence contracts/development/common.md#meaningful-documentation turn: Yaw added by the pivot, degrees about world +Y. pitch: Foot pitch at the pivot's fullest, degrees, positive toes up.
   * @evidence contracts/development/design.md#principled-representation turn: Yaw added by the pivot, degrees about world +Y. pitch: Foot pitch at the pivot's fullest, degrees, positive toes up.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanLegPhrase.ts (AutoMovieMotionHumanLegPhrase.pivot, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanLegPhrase.IPhrase identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
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
