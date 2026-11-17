import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieIntent } from "../../composition/IAutoMovieIntent";
import type { IAutoMovieResolveSchedule } from "../../composition/IAutoMovieResolveSchedule";
import type { IAutoMovieSchedule } from "../../composition/IAutoMovieSchedule";
import type { IAutoMovieMotionMeeting } from "../compose/IAutoMovieMotionMeeting";
import type { IAutoMovieMotionHumanActionLaw } from "../law/IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionHumanBlast } from "./IAutoMovieMotionHumanBlast";
import type { IAutoMovieMotionHumanForce } from "./IAutoMovieMotionHumanForce";
import type { IAutoMovieMotionHumanObstacle } from "./IAutoMovieMotionHumanObstacle";
import type { IAutoMovieMotionHumanPerformance } from "./IAutoMovieMotionHumanPerformance";
import type { IAutoMovieMotionHumanPerformer } from "./IAutoMovieMotionHumanPerformer";
import type { IAutoMovieMotionHumanProp } from "./IAutoMovieMotionHumanProp";
import type { IAutoMovieMotionHumanSegment } from "./IAutoMovieMotionHumanSegment";

/**
 * Everything a performance resolves and its readers share: the people with
 * their placed actions, the props, the laws, the cue tracks and the
 * schedule, built once by the constructor.
 *
 * `HumanPerformance` is the public surface over it. The state's members are
 * public so the `HumanPerformance*` namespaces, which hold the performance's
 * work by responsibility (placing, contacts, layers, the schedule, aiming and
 * reading), can share them; the public helper signatures expose this shared state contract transitively, while HumanPerformance remains the normal author-facing entry point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the record holds, who reads it, why its members are public and that it is not exported.
 * @evidence contracts/development/design.md#principled-representation One record of the resolved performance, built in one place and read by functions that take it, in place of one class of two thousand lines.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members are the ones the performance kept privately before the split (#3399); none was added.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No reader keeps a copy of a member; the caches live here and are settled here.
 */
export interface IAutoMovieMotionHumanPerformanceState {
  /** The resolved schedule. */
  readonly schedule: IAutoMovieSchedule;

  /** Seconds from 0 to the last action's end. */
  readonly duration: number;

  /** The people, as the performance was given them. */
  readonly performers: readonly IAutoMovieMotionHumanPerformer[];

  /** The people with their placed actions, holds, layers and pose caches, by subject. */
  readonly people: Map<string, IAutoMovieMotionHumanSegment.IPerson>;

  /** The props, by subject. */
  readonly props: Map<string, IAutoMovieMotionHumanProp>;

  /** The placed actions that carry an anchor, by the anchor, with their performer. */
  readonly anchors: Map<
    string,
    IAutoMovieMotionHumanSegment.ISegment & {
      /** Scene subject id of the performer owning the anchored action, or of the performer that first computed the cached meeting. */
      subject: string;
    }
  >;

  /** The spans in which each prop is held or worn, by the prop: who holds it in which hand or wears it on which bone, from when to when and at which offset from the hand or the bone; found once the performance is placed. */
  readonly gripCache: Map<
    string,
    IAutoMovieMotionHumanPerformanceState.IGrip[]
  >;

  /** The meetings of the mutual actions, by their kind, start and performers: the performer who computed each and the meeting every role reads. */
  readonly meetings: Map<
    string,
    {
      /** Scene subject id of the performer owning the anchored action, or of the performer that first computed the cached meeting. */
      subject: string;
      /** Resolved mutual-action meeting shared by the two performers. */
      meeting: IAutoMovieMotionMeeting.IMeeting;
    }
  >;

  /** Every law the performance runs, by name: the vocabulary's and the ones it was given. */
  readonly laws: Map<string, IAutoMovieMotionHumanActionLaw<never>>;

  /** The schedule entries that are overlays, by walk-order index: they ride a carrier and never follow or precede one. */
  readonly riding: Set<number>;

  /** What stands in the performers' way. */
  readonly obstacles: readonly IAutoMovieMotionHumanObstacle.IObstacle[];

  /** The forces on the performers (`IAutoMovieMotionHumanPerformance.IInput.forces`). */
  readonly forces: readonly IAutoMovieMotionHumanForce.IForce[];

  /** The cue tracks, by name. */
  readonly cues: Readonly<
    Record<string, readonly IAutoMovieResolveSchedule.ICue[]>
  >;

  /** Where an action aligned into its performer's previous one ended that one, by the previous one's schedule entry. */
  readonly clipped: Map<number, number>;

  /** The instants of every anchored layer, by its anchor: those known before the schedule from the start, the others once it is placed. */
  readonly layered: Map<string, readonly IAutoMovieResolveSchedule.ICue[]>;

  /** The actions that carry the body the composition gives each person, overlays aside, in walk order: a person's placed ones are its first as many as they have placed, and the rest are still to come. */
  readonly intended: Map<string, IAutoMovieIntent[]>;

  /** The scene's blasts (`IAutoMovieMotionHumanPerformance.IInput.blasts`). */
  readonly blasts: readonly IAutoMovieMotionHumanBlast.IBlast[];

  /** The resolved first contacts of every person's striking weapons, in time order, kept for the hit record (`HumanPerformanceHits`). */
  readonly strikes: IAutoMovieMotionHumanPerformanceState.IStrike[];

  /** Whether the schedule is still being resolved: until every action is placed, a pose may read people not placed yet, so nothing is kept. */
  resolving: boolean;
}

/**
 * Companion types of {@link HumanPerformanceState}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation bone: The bone it is worn on; held in the hand when absent. mount: The other prop's socket it rides (`IAutoMovieMotionHumanActionPlan.mounts`); held in the hand or worn when absent. inHand: The grip window's in-hand motion of the prop, composed on `offset` by the span's share (`IAutoMovieMotionHumanContactWindow.inHand`); none when the prop keeps its offset.
 * @evidence contracts/development/design.md#principled-representation bone: The bone it is worn on; held in the hand when absent. mount: The other prop's socket it rides (`IAutoMovieMotionHumanActionPlan.mounts`); held in the hand or worn when absent. inHand: The grip window's in-hand motion of the prop, composed on `offset` by the span's share (`IAutoMovieMotionHumanContactWindow.inHand`); none when the prop keeps its offset.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanHitTrack.ts (HumanHitTrack.instants, self); perform/HumanHitTrack.ts (HumanHitTrack.provisional, self); perform/HumanPerformanceAhead.ts (HumanPerformanceAhead.reader, self); perform/HumanPerformanceAhead.ts (HumanPerformanceAhead.find, self); perform/HumanPerformanceAim.ts (HumanPerformanceAim.aim, self); perform/HumanPerformanceContacts.ts (HumanPerformanceContacts.contacts, self).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanPerformance.IInput, AutoMovieHumanoidBone, IAutoMovieMotionHumanProp.IFrame, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanSegment.ISegment, IAutoMovieMotionHumanActionPlan.IWeapon identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanPerformanceState {
  /**
   * The callable constructor and static factories.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The callable constructor and static factories.
   * @evidence contracts/development/design.md#principled-representation A single canonical performance input constructs the shared resolution state; construction and its possible law refusals remain the runtime state's responsibility.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the enclosing IAutoMovieMotionHumanPerformanceState contract's parameter and result relationships.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanPerformance.IInput, IAutoMovieMotionHumanPerformanceState identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IConstructor {
    /**
     * Resolve a performance.
     *
     * @param input The chain seed, the performers, the props and the composition.
     */
    new (
      input: IAutoMovieMotionHumanPerformance.IInput,
    ): IAutoMovieMotionHumanPerformanceState;
  }

  /**
   * One span in which a prop is held in a hand or worn on a bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation bone: The bone it is worn on; held in the hand when absent. mount: The other prop's socket it rides (`IAutoMovieMotionHumanActionPlan.mounts`); held in the hand or worn when absent. inHand: The grip window's in-hand motion of the prop, composed on `offset` by the span's share (`IAutoMovieMotionHumanContactWindow.inHand`); none when the prop keeps its offset.
   * @evidence contracts/development/design.md#principled-representation bone: The bone it is worn on; held in the hand when absent. mount: The other prop's socket it rides (`IAutoMovieMotionHumanActionPlan.mounts`); held in the hand or worn when absent. inHand: The grip window's in-hand motion of the prop, composed on `offset` by the span's share (`IAutoMovieMotionHumanContactWindow.inHand`); none when the prop keeps its offset.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop.since, g); perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop.carrier, w); perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop.seat, w); perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop.seat.earlier, g); perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop.moved, w); perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop.hold, w).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieMotionHumanProp.IFrame, IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IGrip {
    /** The person who holds or wears it. */
    subject: string;

    /** The holding hand; for a worn span, the side of nothing and unread. */
    side: "left" | "right";

    /** The bone it is worn on; held in the hand when absent. */
    bone?: AutoMovieHumanoidBone;

    /** The other prop's socket it rides (`IAutoMovieMotionHumanActionPlan.mounts`); held in the hand or worn when absent. */
    mount?: {
      /** Scene subject id of the OTHER prop whose socket this grip rides. */
      prop: string;
      /** Socket affordance id on the other prop used by the mount. */
      point: string;
    };

    /** The span's first film second. */
    from: number;

    /** The span's last film second. */
    to: number;

    /** The prop's frame in the hand's or the bone's frame, kept from the span's start. */
    offset?: IAutoMovieMotionHumanProp.IFrame;

    /** The grip window's in-hand motion of the prop, composed on `offset` by the span's share (`IAutoMovieMotionHumanContactWindow.inHand`); none when the prop keeps its offset. */
    inHand?: IAutoMovieMotionHumanContactWindow["inHand"];
  }

  /**
   * One weapon's resolved first contact with another person.
   *
   * @evidence contracts/development/common.md#meaningful-documentation subject: The striker. segment: The striker's action that carries the weapon. weapon: The weapon.
   * @evidence contracts/development/design.md#principled-representation subject: The striker. segment: The striker's action that carries the weapon. weapon: The weapon.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceHits.ts (HumanPerformanceHits.melee, strike); perform/HumanPerformanceState.ts (HumanPerformanceState).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanSegment.ISegment, IAutoMovieMotionHumanActionPlan.IWeapon identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IStrike {
    /** The striker. */
    subject: string;

    /** The striker's action that carries the weapon. */
    segment: IAutoMovieMotionHumanSegment.ISegment;

    /** The weapon. */
    weapon: IAutoMovieMotionHumanActionPlan.IWeapon;

    /** The person struck. */
    against: string;

    /** Film second of contact. */
    seconds: number;
  }
}
