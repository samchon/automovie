import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanPropFlight } from "../perform/IAutoMovieMotionHumanPropFlight";

/**
 * The play of one ball through a placed performance: every hold, launch and
 * contact of the same prop in film order, from which a sport credits its result
 * (a point, a goal, a catch, a fault).
 *
 * Holds come from the grips of the performers' actions, launches and contacts
 * from the prop's engine flights (`IAutoMovieMotionHumanPropFlight`). A contact
 * is recorded only while its flight still owns the ball, so a catch or a stroke
 * that takes the ball ends the flight's contacts.
 */
export interface IAutoMovieMotionHumanBallPlay {
  /** Scene subject id of the ball. */
  ball: string;

  /** Holds, launches and contacts sorted by their first film second. */
  events: IAutoMovieMotionHumanBallPlay.Event[];
}

/** The events of a ball's play and the gates a credited ball passes. */
export namespace IAutoMovieMotionHumanBallPlay {
  /** One event of the play. */
  export type Event = IHold | ILaunch | IContact;

  /**
   * A possession: a span in which one performer holds the ball without a break,
   * in one hand or both.
   */
  export interface IHold {
    /** Event discriminant. */
    kind: "hold";

    /** Scene subject id of the holding performer. */
    subject: string;

    /** The hands that hold the ball at some time in the span, left before right. */
    hands: AutoMovieHumanSide[];

    /** Film second the first grip closes. */
    from: number;

    /** Film second the last grip ends. */
    to: number;

    /** Whether the first grip closes on a flight it catches. */
    caught: boolean;
  }

  /** A launch of the ball by an action. */
  export interface ILaunch {
    /** Event discriminant. */
    kind: "launch";

    /** Film second of the launch. */
    seconds: number;

    /** Scene subject id of the launching performer. */
    subject: string;

    /** Name of the launching action's placed segment. */
    action: string;

    /**
     * The flight's initial point, world metres: the ball centre for a sphere
     * launch.
     */
    point: IAutoMovieVector3;

    /** The flight's initial velocity, world m/s. */
    velocity: IAutoMovieVector3;
  }

  /** A contact of the flying ball. */
  export interface IContact {
    /** Event discriminant. */
    kind: "contact";

    /** Film second of the contact. */
    seconds: number;

    /** What the ball struck. */
    struck: IAutoMovieMotionHumanPropFlight.Struck;

    /** The contact point on the struck surface, world metres. */
    point: IAutoMovieVector3;

    /** What the contact does to the flight. */
    outcome: IAutoMovieMotionHumanPropFlight.IContact["outcome"];
  }

  /** A planar region a credited ball crosses. */
  export type Gate = IDisc | IRectangle;

  /** A round gate, such as a hoop's ring or a cup's mouth. */
  export interface IDisc {
    /** Gate discriminant. */
    kind: "disc";

    /** Centre, world metres. */
    centre: IAutoMovieVector3;

    /** Unit normal pointing to the credited side. */
    normal: IAutoMovieVector3;

    /** Radius, metres. */
    radius: number;
  }

  /** A rectangular gate, such as a goal mouth. */
  export interface IRectangle {
    /** Gate discriminant. */
    kind: "rectangle";

    /** Centre, world metres. */
    centre: IAutoMovieVector3;

    /** Unit normal pointing to the credited side. */
    normal: IAutoMovieVector3;

    /** Unit direction in the gate plane along its height. */
    up: IAutoMovieVector3;

    /** Half width along up cross normal, metres. */
    halfWidth: number;

    /** Half height along up, metres. */
    halfHeight: number;
  }

  /** The first crossing of a gate. */
  export interface ICrossing {
    /** Film second of the crossing. */
    seconds: number;

    /** The tested point on the gate plane, world metres. */
    point: IAutoMovieVector3;
  }
}
