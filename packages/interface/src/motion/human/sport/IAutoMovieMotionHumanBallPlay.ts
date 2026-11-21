import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanPropFlight } from "../perform/IAutoMovieMotionHumanPropFlight";

/**
 * The play of one ball through a placed performance: every hold, launch and
 * contact of the same prop in film order, from which a sport credits its
 * result (a point, a goal, a catch, a fault).
 *
 * Holds come from the grips of the performers' actions, launches and
 * contacts from the prop's engine flights (`IAutoMovieMotionHumanPropFlight`).
 * A contact is recorded only while its flight still owns the ball, so a
 * catch or a stroke that takes the ball ends the flight's contacts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the ball identity, the event kinds, film-second clocks and that contacts end with custody.
 * @evidence contracts/development/design.md#principled-representation A closed discriminated event union keeps the facts each kind carries; times are film seconds and points world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by HumanPerformance.play and read by the sport tests that credit plays; gates are read by HumanBallPlay.crossing.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the flight's struck and outcome records instead of restating them; no score or rule of a particular sport is encoded.
 */
export interface IAutoMovieMotionHumanBallPlay {
  /** Scene subject id of the ball. */
  ball: string;

  /** Holds, launches and contacts sorted by their first film second. */
  events: IAutoMovieMotionHumanBallPlay.Event[];
}

/**
 * The events of a ball's play and the gates a credited ball passes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each event and gate member with units and frames.
 * @evidence contracts/development/design.md#principled-representation Each variant carries a kind discriminant; gates are planar regions with a crediting side.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Companion records of IAutoMovieMotionHumanBallPlay and HumanBallPlay.crossing.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A disc and a rectangle are separate variants rather than optional dimensions on one record.
 */
export namespace IAutoMovieMotionHumanBallPlay {
  /**
   * One event of the play.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the three event variants.
   * @evidence contracts/development/design.md#principled-representation A closed union discriminated by kind.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The element type of IAutoMovieMotionHumanBallPlay.events.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each variant keeps only its own facts.
   */
  export type Event = IHold | ILaunch | IContact;

  /**
   * A possession: a span in which one performer holds the ball without a
   * break, in one hand or both.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the holder, hands, span in film seconds and whether the possession starts by catching a flight.
   * @evidence contracts/development/design.md#principled-representation The union of that performer's overlapping or touching grip spans; `caught` is true only when the first grip captures a launch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Possession reads of the consuming sports.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Worn and mounted spans are not holds and are left out.
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

  /**
   * A launch of the ball by an action.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the launching performer and action, the film second and the flight's start point and velocity.
   * @evidence contracts/development/design.md#principled-representation The point and velocity are the engine projectile's initial state, world metres and m/s.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Exchange reads of the consuming sports: who played the ball, when and how hard.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The action is named by its placed segment, not inferred from the trajectory.
   */
  export interface ILaunch {
    /** Event discriminant. */
    kind: "launch";

    /** Film second of the launch. */
    seconds: number;

    /** Scene subject id of the launching performer. */
    subject: string;

    /** Name of the launching action's placed segment. */
    action: string;

    /** The flight's initial point, world metres: the ball centre for a sphere launch. */
    point: IAutoMovieVector3;

    /** The flight's initial velocity, world m/s. */
    velocity: IAutoMovieVector3;
  }

  /**
   * A contact of the flying ball.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the film second, what was struck, the world contact point and the declared outcome.
   * @evidence contracts/development/design.md#principled-representation Reuses the flight's struck union and outcome literal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Bounce, net, wall, rim and floor reads of the consuming sports.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Contacts after a catch or a later launch are never recorded.
   */
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

  /**
   * A planar region a credited ball crosses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two gate shapes.
   * @evidence contracts/development/design.md#principled-representation A closed union discriminated by kind.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The gate HumanBallPlay.crossing reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shapes are separate variants rather than optional dimensions.
   */
  export type Gate = IDisc | IRectangle;

  /**
   * A round gate, such as a hoop's ring or a cup's mouth.
   *
   * @evidence contracts/development/common.md#meaningful-documentation World centre and unit normal toward the credited side, radius in metres.
   * @evidence contracts/development/design.md#principled-representation The tested point crosses the plane toward the normal within the radius.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by HumanBallPlay.crossing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A caller that credits only a whole ball through shrinks the radius by the ball's own.
   */
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

  /**
   * A rectangular gate, such as a goal mouth.
   *
   * @evidence contracts/development/common.md#meaningful-documentation World centre, unit normal toward the credited side, unit up in the plane and half extents in metres.
   * @evidence contracts/development/design.md#principled-representation The across axis is up cross normal; the tested point must lie within both half extents.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by HumanBallPlay.crossing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `up` must be perpendicular to `normal`; the reader refuses otherwise.
   */
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

  /**
   * The first crossing of a gate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Film second and world point where the tested point meets the gate plane.
   * @evidence contracts/development/design.md#principled-representation The point lies on the plane to the bisection's resolution.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by HumanBallPlay.crossing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Absence of a crossing is an undefined result, not a sentinel time.
   */
  export interface ICrossing {
    /** Film second of the crossing. */
    seconds: number;

    /** The tested point on the gate plane, world metres. */
    point: IAutoMovieVector3;
  }
}
