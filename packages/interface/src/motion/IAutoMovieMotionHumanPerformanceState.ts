import type { IAutoMovieInteractionEvent } from "../cinematics/IAutoMovieInteractionEvent";
import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieIntent } from "./IAutoMovieIntent";
import type { IAutoMovieMotionHumanActionContext } from "./IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanActionLaw } from "./IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanBlast } from "./IAutoMovieMotionHumanBlast";
import type { IAutoMovieMotionHumanContactWindow } from "./IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionHumanForce } from "./IAutoMovieMotionHumanForce";
import type { IAutoMovieMotionHumanObstacle } from "./IAutoMovieMotionHumanObstacle";
import type { IAutoMovieMotionHumanPerformance } from "./IAutoMovieMotionHumanPerformance";
import type { IAutoMovieMotionHumanPerformanceSoft } from "./IAutoMovieMotionHumanPerformanceSoft";
import type { IAutoMovieMotionHumanPerformanceTrial } from "./IAutoMovieMotionHumanPerformanceTrial";
import type { IAutoMovieMotionHumanPerformer } from "./IAutoMovieMotionHumanPerformer";
import type { IAutoMovieMotionHumanProp } from "./IAutoMovieMotionHumanProp";
import type { IAutoMovieMotionHumanPropFlight } from "./IAutoMovieMotionHumanPropFlight";
import type { IAutoMovieMotionHumanSegment } from "./IAutoMovieMotionHumanSegment";
import type { IAutoMovieMotionHumanSharedCarry } from "./IAutoMovieMotionHumanSharedCarry";
import type { IAutoMovieMotionHumanTether } from "./IAutoMovieMotionHumanTether";
import type { IAutoMovieMotionMeeting } from "./IAutoMovieMotionMeeting";
import type { IAutoMovieMotionPropHold } from "./IAutoMovieMotionPropHold";
import type { IAutoMovieMotionWeaponPath } from "./IAutoMovieMotionWeaponPath";
import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";
import type { IAutoMovieScheduleContext } from "./IAutoMovieScheduleContext";
import type { IAutoMovieScheduleCue } from "./IAutoMovieScheduleCue";

/**
 * Everything a performance resolves and its readers share: the people with
 * their placed actions, the props, the laws, the cue tracks and the schedule,
 * built once by the constructor.
 *
 * `AutoMovieMotionHumanPerformance` is the public surface over it. The state's
 * members are public so the `AutoMovieMotionHumanPerformance*` namespaces,
 * which hold the performance's work by responsibility (placing, contacts,
 * layers, the schedule, aiming and reading), can share them; the public helper
 * signatures expose this shared state contract transitively, while
 * AutoMovieMotionHumanPerformance remains the normal author-facing entry
 * point.
 */
export interface IAutoMovieMotionHumanPerformanceState {
  /** The resolved schedule. */
  readonly schedule: IAutoMovieSchedule;

  /** Seconds from 0 to the last action's end. */
  readonly duration: number;

  /** The people, as the performance was given them. */
  readonly performers: readonly IAutoMovieMotionHumanPerformer[];

  /**
   * The people with their placed actions, holds, layers and pose caches, by
   * subject.
   */
  readonly people: Map<string, IAutoMovieMotionHumanSegment.IPerson>;

  /** The props, by subject. */
  readonly props: Map<string, IAutoMovieMotionHumanProp>;

  /**
   * Prepared shared carries by prop, in ascending film order. Each indexed path
   * retains its settled frame for ordinary custody after release.
   */
  readonly sharedCarry?: ReadonlyMap<
    string,
    readonly IAutoMovieMotionHumanSharedCarry.IPreparedEpisode[]
  >;

  /**
   * The lines between props by the far prop they hold, each with the prop that
   * declares it, in declaration order; built once with `props`.
   */
  readonly tethered: ReadonlyMap<
    string,
    readonly IAutoMovieMotionHumanPerformanceState.ITethered[]
  >;

  /**
   * The placed actions that carry an anchor, by the anchor, with their
   * performer.
   */
  readonly anchors: Map<
    string,
    IAutoMovieMotionHumanSegment & {
      /**
       * Scene subject id of the performer owning the anchored action, or of the
       * performer that first computed the cached meeting.
       */
      subject: string;
    }
  >;

  /**
   * The spans in which each prop is held or worn, by the prop: who holds it in
   * which hand or wears it on which bone, from when to when and at which offset
   * from the hand or the bone; solved once when the performance is prepared
   * (`prepareHumanPerformance`), empty while the schedule is resolved.
   */
  readonly grips: Map<string, IAutoMovieMotionHumanPerformanceState.IGrip[]>;

  /**
   * The meetings of the mutual actions, by their kind, start and performers:
   * the performer who computed each and the meeting every role reads.
   */
  readonly meetings: Map<
    string,
    {
      /**
       * Scene subject id of the performer owning the anchored action, or of the
       * performer that first computed the cached meeting.
       */
      subject: string;
      /** Resolved mutual-action meeting shared by the two performers. */
      meeting: IAutoMovieMotionMeeting;
    }
  >;

  /**
   * Every law the performance runs, by name: the vocabulary's and the ones it
   * was given.
   */
  readonly laws: Map<string, IAutoMovieMotionHumanActionLaw<never>>;

  /**
   * The schedule entries that are overlays, by walk-order index: they ride a
   * carrier and never follow or precede one.
   */
  readonly riding: Set<number>;

  /** What stands in the performers' way. */
  readonly obstacles: readonly IAutoMovieMotionHumanObstacle[];

  /**
   * The forces on the performers
   * (`IAutoMovieMotionHumanPerformance.IInput.forces`).
   */
  readonly forces: readonly IAutoMovieMotionHumanForce[];

  /** The cue tracks, by name. */
  readonly cues: Readonly<Record<string, readonly IAutoMovieScheduleCue[]>>;

  /**
   * Where an action aligned into its performer's previous one ended that one,
   * by the previous one's schedule entry.
   */
  readonly clipped: Map<number, number>;

  /**
   * The instants of every anchored layer, by its anchor: those known before the
   * schedule from the start, the others once it is placed.
   */
  readonly layered: Map<string, readonly IAutoMovieScheduleCue[]>;

  /**
   * The actions that carry the body the composition gives each person, overlays
   * aside, in walk order: a person's placed ones are its first as many as they
   * have placed, and the rest are still to come.
   */
  readonly intended: Map<string, IAutoMovieIntent[]>;

  /** The scene's blasts (`IAutoMovieMotionHumanPerformance.IInput.blasts`). */
  readonly blasts: readonly IAutoMovieMotionHumanBlast.IBlast[];

  /**
   * The resolved first contacts of every person's striking weapons, in time
   * order, kept for the hit record (`HumanPerformanceHits`).
   */
  readonly strikes: IAutoMovieMotionHumanPerformanceState.IStrike[];

  /**
   * Whether the schedule is still being resolved: until every action is placed,
   * a pose may read people not placed yet, and a read of a person whose part
   * still waits is refused or places them first.
   */
  resolving: boolean;

  /**
   * While an action is timed, the resolver's placement of a subject's waiting
   * parallel part (`IAutoMovieScheduleContext.demand`), so a read of a person
   * not placed yet places them first; absent outside a timing.
   */
  demand: IAutoMovieScheduleContext["demand"];

  /**
   * While an action is timed, the start up to which a subject holds their last
   * placed pose (`IAutoMovieScheduleContext.horizon`); absent outside a
   * timing.
   */
  horizon: IAutoMovieScheduleContext["horizon"];

  /**
   * While an action is timed, the start of a parallel group a read subject
   * shares with it (`IAutoMovieScheduleContext.meeting`); absent outside a
   * timing.
   */
  meeting: IAutoMovieScheduleContext["meeting"];

  /**
   * While an action is timed, the placement of the waiting part that holds an
   * anchor (`IAutoMovieScheduleContext.demandAnchor`); absent outside a
   * timing.
   */
  demandAnchor: IAutoMovieScheduleContext["demandAnchor"];

  /**
   * The performance's resolved flight policy
   * (`IAutoMovieMotionHumanPerformance.IInput.flight`), captured once for this
   * input.
   */
  readonly flight: NonNullable<
    IAutoMovieMotionHumanPerformance.IInput["flight"]
  >;

  /**
   * How many actions have been placed so far, the count an alignment trial is
   * checked against.
   */
  placements: number;

  /**
   * The plan the last alignment trial made, kept until the next placement reads
   * or drops it; none otherwise.
   */
  trial: IAutoMovieMotionHumanPerformanceTrial | undefined;

  /**
   * Incumbent arm solutions lent between plans of one intent while resolving
   * the schedule.
   */
  readonly handovers: Map<
    IAutoMovieIntent,
    IAutoMovieMotionHumanActionContext.IHandover["last"]
  >;

  /**
   * Each soft prop's solved lattice, by the prop, solved once when the
   * performance is prepared (`HumanPerformanceSoft.prepare`).
   */
  readonly soft: Map<string, IAutoMovieMotionHumanPerformanceSoft.ISolved>;

  /**
   * Each prop's articulation writers in film order, by the prop, solved once
   * when the performance is prepared (`HumanPerformanceObject.writers`).
   */
  readonly writers: Map<
    string,
    readonly IAutoMovieMotionHumanPerformanceState.IWriter[]
  >;

  /**
   * Each launched prop's flights, by the prop, solved once when the performance
   * is prepared (`HumanPropFlight.flights`).
   */
  readonly flights: Map<
    string,
    readonly IAutoMovieMotionHumanPropFlight.IFlight[]
  >;

  /**
   * The flights of each prop being found, so a launch reading its prop sees the
   * flights before it; emptied of a prop when its flights are found.
   */
  readonly flying: Map<string, IAutoMovieMotionHumanPropFlight.IFlight[]>;

  /**
   * Every hit of the placed performance in time order
   * (`HumanPerformanceHits.hits`), solved once when the performance is
   * prepared; none before.
   */
  hits: readonly IAutoMovieInteractionEvent[] | undefined;
}
/** Companion types of {@link HumanPerformanceState}. */
export namespace IAutoMovieMotionHumanPerformanceState {
  /** The callable constructor and static factories. */
  export interface IConstructor {
    /**
     * Resolve a performance.
     *
     * @param input The chain seed, the performers, the props and the
     *   composition.
     */
    new (
      input: IAutoMovieMotionHumanPerformance.IInput,
    ): IAutoMovieMotionHumanPerformanceState;
  }

  /** One span in which a prop is held in a hand or worn on a bone. */
  export interface IGrip {
    /** The person who holds or wears it. */
    subject: string;

    /** The holding hand; for a worn span, the side of nothing and unread. */
    side: "left" | "right";

    /** The bone it is worn on; held in the hand when absent. */
    bone?: AutoMovieHumanoidBone;

    /**
     * The other prop's socket it rides
     * (`IAutoMovieMotionHumanActionPlan.mounts`); held in the hand or worn when
     * absent.
     */
    mount?: IGripMount;

    /** The span's first film second. */
    from: number;

    /** The exact launch this staged grip captures when it starts. */
    capture?: IAutoMovieMotionPropHold["capture"];

    /** The span's last film second. */
    to: number;

    /**
     * A hand span's hand frame at a film second, from the course the
     * performance prepares once every action is placed: what the prop is read
     * on, so no read of the prop evaluates the holder's live posture.
     *
     * @param seconds Film seconds within the span.
     * @returns The hand's grip socket frame.
     */
    hand?: (seconds: number) => IAutoMovieRigidTransform;

    /**
     * The prop's frame in the hand's or the bone's frame, kept from the span's
     * start.
     */
    offset?: IAutoMovieRigidTransform;

    /**
     * The grip window's in-hand motion of the prop, composed on `offset` by the
     * span's share (`IAutoMovieMotionHumanContactWindow.inHand`); none when the
     * prop keeps its offset.
     */
    inHand?: IAutoMovieMotionHumanContactWindow["inHand"];
  }

  /** The mount object of {@link IGrip}. */
  export type IGripMount = {
    /** Scene subject id of the OTHER prop whose socket this grip rides. */
    prop: string;
    /** Socket affordance id on the other prop used by the mount. */
    point: string;
    /**
     * Whether the prop is set exactly on the socket
     * (`IAutoMovieMotionPropMount.seated`).
     */
    seated?: boolean;
  };

  /**
   * One timed writer of a prop articulation's travel
   * (`HumanPerformanceObject.writers`).
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
     */
    travel(seconds: number): number;

    /** The action that drives it, or undefined for the prop's own track. */
    source?: IAutoMovieMotionHumanSegment & {
      /** The driving performer's subject id. */
      subject: string;
    };
  }

  /** A line found by its far prop: the prop that declares it, and the line. */
  export interface ITethered {
    /** The prop that declares the line. */
    owner: IAutoMovieMotionHumanProp;

    /** The line. */
    tether: IAutoMovieMotionHumanTether;
  }

  /** One weapon's resolved first contact with another person. */
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
