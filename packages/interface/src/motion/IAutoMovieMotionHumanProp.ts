import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieAffordance } from "../model/IAutoMovieAffordance";
import type { IAutoMovieBody } from "../model/IAutoMovieBody";
import type { IAutoMoviePhysicalShape } from "../physics/IAutoMoviePhysicalShape";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieSoftBodyDomain } from "../soft/IAutoMovieSoftBodyDomain";
import type { AutoMovieMotionHumanScheduledInstant } from "./AutoMovieMotionHumanScheduledInstant";
import type { IAutoMovieMotionHumanObject } from "./IAutoMovieMotionHumanObject";
import type { IAutoMovieMotionHumanTether } from "./IAutoMovieMotionHumanTether";

/**
 * A prop actions can aim at and hands can hold: a subject id, its world frame
 * at rest, and its named points in that frame, such as a heavy bag's striking
 * surface, a pad's face or a cup's handle.
 *
 * The prop stays at its rest frame, on the bone it is worn on, or at its
 * initial mount until a hand grips it; while gripped it rides the hand, unless
 * it is a fixture, worn it rides its bone, and it stays where the last grip
 * released it, or flies from a launch and rests where it struck (see
 * `AutoMovieMotionHumanPerformance.prop`). A point's normal points out of the prop's surface.
 */
export interface IAutoMovieMotionHumanProp {
  /** Subject id, unique in the performance. */
  subject: string;

  /** The prop's world frame before any grip. */
  frame: IAutoMovieRigidTransform;

  /** Named points in the prop's frame, metres, with outward unit normals. */
  points: Readonly<
    Record<
      string,
      {
        /** Named contact point in the PROP-LOCAL frame, metres. */
        point: IAutoMovieVector3;
        /** Outward unit contact normal in the PROP-LOCAL frame. */
        normal: IAutoMovieVector3;
      }
    >
  >;

  /**
   * The prop's world frame at a film second, for a prop that moves by itself: a
   * vehicle on its course, a horse at its gait, a lift. While set, the prop is
   * where this says and no grip carries it; what bears on it (a rider's seat, a
   * hand on its wheel) is carried with it.
   *
   * @param seconds Film seconds.
   * @returns The frame.
   */
  motion?(seconds: number): IAutoMovieRigidTransform;

  /**
   * A named point in the world at a film second, for a prop whose parts move
   * within it: a pedal on its crank, a stirrup on a trotting horse, a handle on
   * a door that swings. `points` holds a point where it is in the prop at rest,
   * and the prop's frame alone carries it rigidly; a point this knows is read
   * here instead, so a foot or a hand aimed at it follows the part and not the
   * place the part had at rest.
   *
   * @param id The point's name, one of `points`.
   * @param seconds Film seconds.
   * @returns The point and its outward unit normal, world metres; undefined for
   *   a point that only moves with the prop's frame.
   */
  point?(
    id: string,
    seconds: number,
  ): IAutoMovieMotionHumanProp.IPlacedPoint | undefined;

  /**
   * The prop-local material geometry supplied by an externally posed model,
   * such as a horse at its gait. A snapshot reads it at the requested film
   * second in preference to the geometry of the articulation state.
   *
   * @param seconds Film seconds.
   * @returns The posed affordances and colliders in the prop's own frame.
   */
  poseAt?(seconds: number): IAutoMovieMotionHumanProp.IPosed;

  /**
   * The person and bone the prop is worn on from the film's start, with its
   * frame in the bone's posed frame: a hat on the head, a holster on the hips.
   * While worn it rides that bone and `frame` is not read; a grip takes it off,
   * and an action's `wears` puts it on again. Not worn when absent.
   */
  worn?: IAutoMovieMotionHumanProp.IWorn;

  /**
   * The socket another prop carries this rigid prop on from the film's start.
   * The frame follows the posed socket through the first hand closure, which
   * takes over placement. The target affordance must be declared on the other
   * prop. Mount chains must end at a prop with no initial mount.
   * `AutoMovieMotionHumanPerformance` refuses a mounted prop that also declares `worn`,
   * `motion`, `fixed: true`, or `soft`.
   */
  mounted?: IAutoMovieMotionHumanProp.IMounted;

  /**
   * Whether the prop is a fixture: a thing set in the scene that bears on the
   * floor or a wall and is never lifted, such as a ladder, a rail or a wall
   * bar. A hand that grips a fixture bears on it, as a climber's hand on a
   * rung, and never carries it, so it stays at its rest frame whatever grips
   * it. Not a fixture when absent.
   */
  fixed?: boolean;

  /**
   * Contact frames in the prop's frame (a handle's `+Y` approach and `+X`
   * wrapped axis), which a grasp plans from by id.
   */
  affordances?: readonly IAutoMovieAffordance[];

  /**
   * The prop's cloth or cord lattice, for a prop that bends: a towel, a flag, a
   * rope. Its particles are solved once over the performance from the displayed
   * poses (`HumanPerformanceSoft`): its anchors may ride a performer's bone
   * (`actor-bone`) or a rigid prop's frame (a `node` binding naming that prop's
   * subject), its body capsules a performer's bones, and a hand's grip on the
   * prop holds the particle nearest the hand. Its rest is in world metres.
   * Rigid when absent.
   */
  soft?: IAutoMovieSoftBodyDomain;

  /**
   * A soft cord whose first and last anchors follow a single declared span.
   * Absent leaves every soft anchor to its own ordinary binding.
   */
  softSpan?: IAutoMovieMotionHumanProp.ISoftSpan;

  /**
   * Colliders in the prop's frame, for finger closure until contact and
   * penetration audits.
   */
  shapes?: readonly IAutoMoviePhysicalShape[];

  /**
   * Whether the model declares internal articulation. Explicit false allows
   * rigid carry even when a uniform model adapter exposes a pose reader.
   */
  readonly hasArticulations?: boolean;

  /**
   * The prop posed at stated travels of its articulations, for a prop whose
   * parts an act moves (a door's leaf, a trigger, a bowstring): its contacts
   * and colliders in its own frame with the parts moved. The performance reads
   * it at the travels the drives and tracks give at a second
   * (`AutoMovieMotionHumanPerformance.state`), so a hand reaching a handle after the door was
   * opened goes to where the handle is. A rigid object's model adapter can also
   * expose this reader.
   *
   * @param state Travel by articulation id, in each articulation's own unit; an
   *   articulation left out stays at rest.
   * @returns The posed contacts and colliders.
   * @throws {Error} When a travel lies outside its articulation's range.
   */
  articulate?(
    state: Readonly<Record<string, number>>,
  ): IAutoMovieMotionHumanProp.IPosed;

  /**
   * An explicit single-contact reader at absolute articulation travels in prop
   * space. `AutoMovieMotionHumanObject.articulateSite` also resolves projections prepared by
   * its articulation adapter. Undefined leaves the contact to the full
   * articulation callback.
   */
  articulateSite?(
    id: string,
    state: Readonly<Record<string, number>>,
  ): IAutoMovieAffordance | undefined;

  /**
   * The prop's own movements after a trigger, each an articulation's travel
   * from a start instant: a trebuchet's arm swinging once its pin is pulled, a
   * door swinging shut on its closer. They share one state with the
   * performance's drives. None when absent.
   */
  tracks?: readonly IAutoMovieMotionHumanProp.ITrack[];

  /**
   * The prop's physical data as its model declares it: its mass, which a hit it
   * delivers in flight carries, and the contact data its flights read
   * (`HumanPropFlight`). Absent when the model declares none.
   */
  body?: IAutoMovieBody;

  /**
   * Lines from the prop's points to other props' points: a rod's fishing line
   * to its lure. A line shorter than the distance between its ends pulls the
   * far prop toward this one while no hand holds it
   * (`IAutoMovieMotionHumanTether`). None when absent.
   */
  tethers?: readonly IAutoMovieMotionHumanTether[];
}

/** Contracts used by HumanWorn.frame, ball, ladderProp, wearable. */
export namespace IAutoMovieMotionHumanProp {
  /** Which already placed prop and model line own the endpoints of a soft cord. */
  export interface ISoftSpan {
    /** Subject id of the rigid prop in the same performance. */
    owner: string;

    /** Span id on the owner's model. */
    id: string;

    /**
     * The model span's declared rest length in metres. Absent keeps the
     * domain's supplied rest shape.
     */
    length?: number;
  }

  /** A moving contact in world space. */
  export interface IPlacedPoint {
    /** Contact point on the prop in world metres. */
    point: IAutoMovieVector3;

    /** Outward contact normal in world coordinates. */
    normal: IAutoMovieVector3;

    /**
     * World rotation of the placed affordance, when the provider has its full
     * frame.
     */
    rotation?: IAutoMovieQuaternion;
  }

  /**
   * One authored attachment of a prop to a subject's bone. Its offset is
   * expressed in that bone's posed frame; performance readers derive any worn
   * interval from this configuration.
   */
  export interface IWorn {
    /** The wearer's subject id. */
    subject: string;

    /** The bone it rides. */
    bone: AutoMovieHumanoidBone;

    /** The prop's frame in the bone's posed frame, metres. */
    offset: IAutoMovieRigidTransform;
  }

  /** A rigid prop's initial frame relative to a named socket on another prop. */
  export interface IMounted {
    /** Subject id of the prop carrying the socket. */
    prop: string;

    /** The carrying prop's affordance id. */
    point: string;

    /**
     * The mounted prop's frame in that posed socket, with finite metre position
     * and unit rotation.
     */
    offset: IAutoMovieRigidTransform;
  }

  /** A prop posed in its own frame. */
  export interface IPosed {
    /** Its contacts, with the moved parts' contacts moved. */
    affordances: readonly IAutoMovieAffordance[];

    /**
     * Its colliders, with the moved parts' colliders moved; absent when the
     * prop declares none.
     */
    shapes?: readonly IAutoMoviePhysicalShape[];

    /** The model's authored span endpoints in this posed model's local frame. */
    span?(id: string): IAutoMovieMotionHumanObject.ISpanEnds;
  }

  /** An articulation's travel run by the prop itself from a start instant. */
  export interface ITrack {
    /** The articulation affordance it moves. */
    articulation: string;

    /**
     * Film second it starts, or a named instant of an anchored action or a cue
     * track it starts at, as a layer's window names one.
     */
    start: AutoMovieMotionHumanScheduledInstant;

    /**
     * The travel at a second of the track, in the articulation's own unit.
     * Pure.
     *
     * @param seconds Seconds since the track's start.
     * @returns The travel.
     */
    travel(seconds: number): number;

    /**
     * Seconds the track lasts; its last travel holds after. Endless when
     * absent.
     */
    duration?: number;
  }
}
