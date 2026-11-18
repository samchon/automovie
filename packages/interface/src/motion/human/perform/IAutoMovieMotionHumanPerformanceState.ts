import type { IAutoMovieInteractionEvent } from "../../../cinematics/IAutoMovieInteractionEvent";
import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieIntent } from "../../composition/IAutoMovieIntent";
import type { IAutoMovieSchedule } from "../../composition/IAutoMovieSchedule";
import type { IAutoMovieScheduleCue } from "../../composition/IAutoMovieScheduleCue";
import type { IAutoMovieMotionMeeting } from "../compose/IAutoMovieMotionMeeting";
import type { IAutoMovieMotionHumanActionLaw } from "../law/IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionWeaponPath } from "../law/IAutoMovieMotionWeaponPath";
import type { IAutoMovieMotionHumanBlast } from "./IAutoMovieMotionHumanBlast";
import type { IAutoMovieMotionHumanForce } from "./IAutoMovieMotionHumanForce";
import type { IAutoMovieMotionHumanObstacle } from "./IAutoMovieMotionHumanObstacle";
import type { IAutoMovieMotionHumanPerformance } from "./IAutoMovieMotionHumanPerformance";
import type { IAutoMovieMotionHumanPerformanceSoft } from "./IAutoMovieMotionHumanPerformanceSoft";
import type { IAutoMovieMotionHumanPerformanceTrial } from "./IAutoMovieMotionHumanPerformanceTrial";
import type { IAutoMovieMotionHumanPerformer } from "./IAutoMovieMotionHumanPerformer";
import type { IAutoMovieMotionHumanProp } from "./IAutoMovieMotionHumanProp";
import type { IAutoMovieMotionHumanPropFlight } from "./IAutoMovieMotionHumanPropFlight";
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
 * @evidence contracts/development/common.md#meaningful-documentation States what the record holds, who reads it, why its members are public and that it is not exported. bone: The bone it is worn on; held in the hand when absent. mount: The other prop's socket it rides (`IAutoMovieMotionHumanActionPlan.mounts`); held in the hand or worn when absent. inHand: The grip window's in-hand motion of the prop, composed on `offset` by the span's share (`IAutoMovieMotionHumanContactWindow.inHand`); none when the prop keeps its offset.
 * @evidence contracts/development/design.md#principled-representation One record of the resolved performance, built in one place and read by functions that take it, in place of one class of two thousand lines. bone: The bone it is worn on; held in the hand when absent. mount: The other prop's socket it rides (`IAutoMovieMotionHumanActionPlan.mounts`); held in the hand or worn when absent. inHand: The grip window's in-hand motion of the prop, composed on `offset` by the span's share (`IAutoMovieMotionHumanContactWindow.inHand`); none when the prop keeps its offset.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members are the ones the performance kept privately before the split (#3399), and the readers' per-performance results (soft parts, prop writers and posings, flights, hits) the performance owns. Runtime boundary references: perform/HumanHitTrack.ts (HumanHitTrack.instants, self); perform/HumanHitTrack.ts (HumanHitTrack.provisional, self); perform/HumanPerformanceAhead.ts (HumanPerformanceAhead.reader, self); perform/HumanPerformanceAhead.ts (HumanPerformanceAhead.find, self); perform/HumanPerformanceAim.ts (HumanPerformanceAim.aim, self); perform/HumanPerformanceContacts.ts (HumanPerformanceContacts.contacts, self).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No reader keeps a copy of a member; the caches live here and are settled here. Shares the canonical IAutoMovieMotionHumanPerformance.IInput, AutoMovieHumanoidBone, IAutoMovieRigidTransform, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanSegment, IAutoMovieMotionWeaponPath identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
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
    IAutoMovieMotionHumanSegment & {
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
      meeting: IAutoMovieMotionMeeting;
    }
  >;

  /** Every law the performance runs, by name: the vocabulary's and the ones it was given. */
  readonly laws: Map<string, IAutoMovieMotionHumanActionLaw<never>>;

  /** The schedule entries that are overlays, by walk-order index: they ride a carrier and never follow or precede one. */
  readonly riding: Set<number>;

  /** What stands in the performers' way. */
  readonly obstacles: readonly IAutoMovieMotionHumanObstacle[];

  /** The forces on the performers (`IAutoMovieMotionHumanPerformance.IInput.forces`). */
  readonly forces: readonly IAutoMovieMotionHumanForce[];

  /** The cue tracks, by name. */
  readonly cues: Readonly<Record<string, readonly IAutoMovieScheduleCue[]>>;

  /** Where an action aligned into its performer's previous one ended that one, by the previous one's schedule entry. */
  readonly clipped: Map<number, number>;

  /** The instants of every anchored layer, by its anchor: those known before the schedule from the start, the others once it is placed. */
  readonly layered: Map<string, readonly IAutoMovieScheduleCue[]>;

  /** The actions that carry the body the composition gives each person, overlays aside, in walk order: a person's placed ones are its first as many as they have placed, and the rest are still to come. */
  readonly intended: Map<string, IAutoMovieIntent[]>;

  /** The scene's blasts (`IAutoMovieMotionHumanPerformance.IInput.blasts`). */
  readonly blasts: readonly IAutoMovieMotionHumanBlast.IBlast[];

  /** The resolved first contacts of every person's striking weapons, in time order, kept for the hit record (`HumanPerformanceHits`). */
  readonly strikes: IAutoMovieMotionHumanPerformanceState.IStrike[];

  /** Whether the schedule is still being resolved: until every action is placed, a pose may read people not placed yet, so nothing is kept. */
  resolving: boolean;

  /** The performance's resolved flight policy (`IAutoMovieMotionHumanPerformance.IInput.flight`), captured once for this input. */
  readonly flight: NonNullable<
    IAutoMovieMotionHumanPerformance.IInput["flight"]
  >;

  /** How many actions have been placed so far, the count an alignment trial is checked against. */
  placements: number;

  /** The plan the last alignment trial made, kept until the next placement reads or drops it; none otherwise. */
  trial: IAutoMovieMotionHumanPerformanceTrial | undefined;

  /** Each performer's solved soft parts, by subject, kept once the performance is placed (`HumanPerformanceSoft.of`). */
  readonly soft: Map<string, IAutoMovieMotionHumanPerformanceSoft.ISolved>;

  /** Each prop's articulation writers in film order, by the prop, kept once the performance is placed (`HumanPerformanceObject.writers`). */
  readonly writers: Map<string, readonly IAutoMovieMotionHumanPerformanceState.IWriter[]>;

  /** Each prop's last posed reading with its film second, by the prop, kept once the performance is placed (`HumanPerformanceObject.posed`). */
  readonly posed: Map<
    string,
    {
      /** The film second read. */
      seconds: number;
      /** The prop posed at that second. */
      posed: IAutoMovieMotionHumanProp.IPosed;
    }
  >;

  /** Each launched prop's flights, by the prop, kept once the performance is placed (`HumanPropFlight.flights`). */
  readonly flights: Map<string, readonly IAutoMovieMotionHumanPropFlight.IFlight[]>;

  /** The flights of each prop being found, so a launch reading its prop sees the flights before it; emptied of a prop when its flights are found. */
  readonly flying: Map<string, IAutoMovieMotionHumanPropFlight.IFlight[]>;

  /** Every hit of the placed performance in time order (`HumanPerformanceHits.hits`), kept on its first read once the performance is placed; none before. */
  hits: readonly IAutoMovieInteractionEvent[] | undefined;
}
/**
 * Companion types of {@link HumanPerformanceState}.
 *
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
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieRigidTransform, IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
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
    offset?: IAutoMovieRigidTransform;

    /** The grip window's in-hand motion of the prop, composed on `offset` by the span's share (`IAutoMovieMotionHumanContactWindow.inHand`); none when the prop keeps its offset. */
    inHand?: IAutoMovieMotionHumanContactWindow["inHand"];
  }

  /**
   * One timed writer of a prop articulation's travel (`HumanPerformanceObject.writers`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation A writer names its authored coordinate and the independent degree of freedom it addresses, its film-second window and its travel there.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by `HumanPerformanceObject`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A prop's own track leaves the source absent, so one list orders both kinds.
   */
  export interface IWriter {
    /** The articulation affordance. */
    articulation: string;

    /** The independent degree of freedom this coordinate addresses. */
    leader: string;

    /** Film second it begins. */
    from: number;

    /** Film second it ends. */
    to: number;

    /**
     * The travel at a film second inside the window.
     *
     * @param seconds Film seconds within `from` to `to`.
     * @returns The coordinate's travel, in the articulation's own unit.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the input's frame and the result.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable member has no algorithm body; the placed performance supplies it from the driving action's writer.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the provider owns its decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature defines no cache; the provider owns result equivalence.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handle; the provider owns what it keeps.
     */
    travel(seconds: number): number;

    /** The action that drives it, or undefined for the prop's own track. */
    source?: IAutoMovieMotionHumanSegment & {
      /** The driving performer's subject id. */
      subject: string;
    };
  }

  /**
   * One weapon's resolved first contact with another person.
   *
   * @evidence contracts/development/common.md#meaningful-documentation subject: The striker. segment: The striker's action that carries the weapon. weapon: The weapon.
   * @evidence contracts/development/design.md#principled-representation subject: The striker. segment: The striker's action that carries the weapon. weapon: The weapon.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceHits.ts (HumanPerformanceHits.melee, strike); perform/HumanPerformanceState.ts (HumanPerformanceState).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanSegment, IAutoMovieMotionWeaponPath identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IStrike {
    /** The striker. */
    subject: string;

    /** The striker's action that carries the weapon. */
    segment: IAutoMovieMotionHumanSegment;

    /** The weapon. */
    weapon: IAutoMovieMotionWeaponPath;

    /** The person struck. */
    against: string;

    /** Film second of contact. */
    seconds: number;
  }
}
