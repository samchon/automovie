import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A mounted performance on a moving carrier: an ordered list of seat figures,
 * each planned in the frame of one of the carrier's own contacts and carried
 * with it, with the body supports each figure names acquired, held, transferred
 * and released at their figure's instants. A side-saddle rider settling onto
 * the fixed head and the near stirrup, and a vaulter going from the basic seat
 * to the bench on a surcingle's handles, are such lists on a horse given as a
 * moving prop.
 *
 * The law (`HumanMounted`) is entered seated on the carrier, as `sit` leaves a
 * body, and ends seated, so `ride` or `rise` follows it. A transfer between two
 * figures keeps at least one support held through it, the seat or a hand on the
 * same contact, so weight passes to the next support before the last is
 * released.
 */
export interface IAutoMovieMotionHumanMounted {
  /** The moving prop the performer is on: its subject id in the performance. */
  on: string;

  /**
   * The carrier's contact whose moving frame every figure is planned in, by its
   * id: a saddle's seat or a vaulting pad's seat.
   */
  frame: string;

  /** The figures in order, at least one; the last one keeps the seat. */
  figures: IAutoMovieMotionHumanMounted.IFigure[];

  /**
   * The carrier's stride time, seconds, more than none. Out of the saddle the
   * pelvis then follows the carrier's path averaged over one stride, so it
   * stays nearly level while the back rises and falls under it, the decoupling
   * a jockey's crouch gives (Pfau et al. 2009, Science 325:289), and a hand
   * ride pushes the hands along the reins once a stride. Without it every
   * figure is carried rigidly with the contact and a hand ride is refused.
   * Nothing is read from a gait name: give the carrier's own stride time. A
   * horse of 1.4 m at the withers measured about 0.9 s at a walk (1.5 m/s),
   * 0.64 s at a trot (3 m/s), 0.5 s at a canter (5 m/s) and 0.4 s at a gallop
   * (8 m/s) (`AutoMovieArchetypeEquineGait.TABLE`, Robilliard et al. 2007);
   * warmbloods are about 15 % slower, and the table's scaling to other heights
   * is provisional.
   */
  stride?: number;

  /**
   * How much of the carrier's own pitch and roll since the performance began
   * the rider's trunk leans against, 0 to 1: the seat response that leans
   * forward while the horse rears and back while it bucks. The pelvis stays
   * carried on the saddle. None when absent.
   */
  respond?: number;

  /**
   * The rider's aids, each cueing the carrier's transitions on a cue track;
   * none when absent.
   */
  aids?: IAutoMovieMotionHumanMounted.IAid[];

  /**
   * A cue track of the carrier's transitions that each need an aid: a
   * transition on it that no aid cues is refused. Unaided riding when absent.
   */
  aided?: string;
}

/** Companion types of {@link IAutoMovieMotionHumanMounted}. */
export namespace IAutoMovieMotionHumanMounted {
  /**
   * One seat figure: how the performer reaches it from the previous figure, how
   * long it is held and what each named body part bears on.
   */
  export interface IFigure {
    /** The seat kind of the figure. */
    seat: Seat;

    /**
     * Seconds the transfer from the previous figure, or from the entry for the
     * first, takes; more than none. The time is the author's: no source for a
     * mounting time was read (missing).
     */
    transfer: number;

    /** Seconds the figure is held after its transfer; none or more. */
    hold: number;

    /**
     * What each body part bears on, by the carrier's contact ids; nothing when
     * absent.
     */
    supports?: ISupports;

    /**
     * Whether the held reins are pushed along the neck and back once a stride,
     * a jockey's hand ride; needs `stride` and both hands holding.
     */
    handRide?: boolean;

    /**
     * Whip strokes in the figure's hold: the hand on `side` leaves its rein,
     * strikes behind the rider's thigh at each instant of the performance cue
     * track `cue`, and takes the rein again; none when absent.
     */
    whip?: IWhip;
  }

  /** A figure's whip strokes, timed by a cue track of the performance. */
  export interface IWhip {
    /** The striking hand. */
    hand: AutoMovieHumanSide;

    /**
     * The cue track whose instants inside the figure's hold are the strokes'
     * contacts, film seconds.
     */
    cue: string;
  }

  /** The carrier contacts the body parts of a figure bear on, each by its id. */
  export interface ISupports {
    /** The handle, rein or grip the left hand holds. */
    leftHand?: string;

    /** The handle, rein or grip the right hand holds. */
    rightHand?: string;

    /** The stirrup or rest the left sole stands on. */
    leftFoot?: string;

    /** The stirrup or rest the right sole stands on. */
    rightFoot?: string;

    /** The surface the left knee rests on. */
    leftKnee?: string;

    /** The surface the right knee rests on. */
    rightKnee?: string;

    /** The bar the right thigh lies over: a side saddle's fixed head. */
    rightThigh?: string;
  }

  /**
   * A seat kind, the posture a figure holds in the carrier contact's frame:
   *
   * - `entered`: the seated posture the law was entered with, legs as they were;
   * - `aside`: a side-saddle seat, square to the carrier's front, the right thigh
   *   over `rightThigh` and the left sole on `leftFoot`;
   * - `basic`: a vaulter's basic seat astride, upright, both arms stretched to
   *   the sides with the fingertips at eye level, no hand holding;
   * - `bench`: a vaulter's bench, both knees on `leftKnee` and `rightKnee` with
   *   the feet tucked behind, the trunk inclined forward and both hands on
   *   their handles; the seat is free;
   * - `twoPoint`: the two-point seat, the seat clear of the saddle, the weight in
   *   the stirrups `leftFoot` and `rightFoot`, the trunk inclined forward and
   *   the hands forward on the reins;
   * - `crouch`: a jockey's racing crouch on short stirrups, the seat well clear
   *   of the saddle and the trunk level;
   * - `standing`: standing in the stirrups, the knees nearly straight and the
   *   trunk upright;
   * - `descent`: down a bank, seated with the heels down in the stirrups
   *   `leftFoot` and `rightFoot` and the hands giving the reins forward, the
   *   trunk kept upright in space against the carrier's pitch and roll at every
   *   instant;
   * - `ascent`: up a bank, a light seat clear of the saddle over the stirrups
   *   `leftFoot` and `rightFoot`, the trunk inclined forward over the withers
   *   in space against the carrier's pitch and roll at every instant, a hand
   *   that names the `mane` taking it.
   *
   * `entered` may name the stirrups its entry already stands in, so a transfer
   * to an out-of-saddle seat keeps them.
   */
  export type Seat =
    | "entered"
    | "aside"
    | "basic"
    | "bench"
    | "twoPoint"
    | "crouch"
    | "standing"
    | "descent"
    | "ascent";

  /**
   * A rider's aid: a movement of the hands, legs, seat or voice the carrier
   * answers, made `latency` seconds before each instant of the cue track `cue`,
   * the carrier's transitions, and released once the carrier has answered.
   */
  export interface IAid {
    /** The aid. */
    kind: Aid;

    /**
     * The hand or leg that gives it; both when absent. A seat or voice aid has
     * none.
     */
    side?: AutoMovieHumanSide;

    /**
     * The cue track whose instants, film seconds, are the transitions the aid
     * cues.
     */
    cue: string;

    /** Seconds from the aid's onset to the transition it cues, more than none. */
    latency: number;
  }

  /**
   * A rider's aid:
   *
   * - `squeeze`: the lower leg closes on the horse, the heel drawn in about the
   *   ball on the stirrup;
   * - `kick`: the heel lifts and comes back about the ball;
   * - `takeUp`: the rein hand draws the rein back toward the rider, then gives it
   *   back;
   * - `openRein`: the rein hand moves out from the neck on its side;
   * - `neckRein`: the rein hand lays the rein across the neck toward the other
   *   side;
   * - `seat`: the pelvis tips back, a weight shift into the saddle;
   * - `voice`: a spoken cue, marked as an event with no movement;
   * - `shake`: a driver shakes the lines, the hands lifting and dropping them in
   *   quick waves;
   * - `whipTouch`: a driver touches the horse with the whip, the whip hand
   *   flicking forward and up and back.
   */
  export type Aid =
    | "squeeze"
    | "kick"
    | "takeUp"
    | "openRein"
    | "neckRein"
    | "seat"
    | "voice"
    | "shake"
    | "whipTouch";

  /** Where a second falls on a mounted performance's clock. */
  export interface IPhase {
    /** The figure begun last, an index into the figures. */
    index: number;

    /**
     * How far its transfer has gone, 0 to 1 eased by minimum jerk; 1 through
     * its hold.
     */
    share: number;
  }
}
