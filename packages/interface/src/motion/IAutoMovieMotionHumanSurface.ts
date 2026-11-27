import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * Authoring inputs for the surface motion laws. A glide shapes a travel path
 * from the performer's entry, while a ride preserves the foot placements on a
 * separately animated deck.
 */
export namespace IAutoMovieMotionHumanSurface {
  /** One displayed contact point and the equipment's forward direction at it. */
  export interface IGlideSample {
    /** The displayed point on the sole, blade or ski, in world metres. */
    point: IAutoMovieVector3;

    /** Forward along the displayed equipment, a nonzero world direction. */
    forward: IAutoMovieVector3;
  }

  /** An oriented contact plane for measuring a glide. */
  export interface IGlidePlane {
    /** Any point on the support surface, in world metres. */
    point: IAutoMovieVector3;

    /** Nonzero world direction pointing out of the surface. */
    normal: IAutoMovieVector3;
  }

  /** The signed components of displayed surface travel. */
  export interface IGlideMeasure {
    /** Displacement between samples along the equipment, in metres. */
    along: number;

    /** Signed sideways displacement between samples, in metres, positive right. */
    across: number;

    /** Normal gap at the last sample, in metres, negative for penetration. */
    gap: number;
  }

  /** A glide path with an optional arc and deceleration. */
  export interface IGlideParams {
    /**
     * Duration in seconds, positive. No natural value is defined: choose it for
     * the beat (provisional, missing).
     */
    duration: number;

    /**
     * Travel speed in metres per second, positive. Approached from the entry
     * speed. No natural value is defined: choose it for the beat (provisional,
     * missing).
     */
    speed: number;

    /**
     * Signed total turn in degrees relative to entry heading, in [-180, 180].
     * Absent is straight.
     */
    turn?: number;

    /**
     * Decelerate to rest by the end of the action. Absent finishes at travel
     * speed.
     */
    stop?: boolean;
  }

  /**
   * A pushed glide on two skates with optional real blade-edge contacts and one
   * foot's timed release and recovery.
   */
  export interface ISkateParams extends IGlideParams {
    /** Cant about each skate's forward axis through its selected runner edge. */
    edge?: IBladeEdge;

    /** Release and replace one skate during the glide. */
    step?: ISkateStep;
  }

  /** The selected physical edge on each runner with its signed cant. */
  export interface IBladeEdge {
    /** Signed rotation about each foot's +Z direction, in degrees, in [-90, 90]. */
    degrees: number;

    /**
     * Left and right edge locations in their respective foot joint frames,
     * metres.
     */
    pivots: Readonly<Record<AutoMovieHumanSide, IAutoMovieVector3>>;
  }

  /**
   * One supported skate step, including a crossover when the offset reaches the
   * opposite side. The other skate glides throughout.
   */
  export interface ISkateStep {
    /** Side of the released foot. */
    side: AutoMovieHumanSide;

    /** Action seconds at release and reacquisition. */
    window: IWindow;

    /** Metres of displacement along the moving stance's +X and forward +Z. */
    offset: Readonly<IStepOffset>;

    /** Peak height above the original runner plane, metres. */
    clearance: number;
  }

  /** A released skate's displacement on the ice plane of its moving stance. */
  export interface IStepOffset {
    /** Metres along the moving stance's +X. */
    x: number;

    /** Metres along the moving stance's forward +Z. */
    z: number;
  }

  /**
   * A flat-foot curling delivery with a lowered pelvis and a trailing shoe
   * hinged around its forefoot.
   */
  export interface ICurlDeliveryParams {
    /** Positive duration in seconds. */
    duration: number;

    /**
     * Positive forward glide speed in metres per second. No natural value is
     * defined: choose it for the beat (provisional, missing).
     */
    speed: number;

    /** Ease to a stop and recover upright by the end. */
    stop?: boolean;

    /** Side whose flat shoe carries the delivery. */
    lead: AutoMovieHumanSide;

    /** Additional pelvis drop below the ordinary glide, metres. */
    drop: number;

    /**
     * Distance each shoe travels from the entry stance, forward for the leading
     * shoe and backward for the trailing shoe, metres.
     */
    trail: number;

    /**
     * Trailing heel lift by pitch around the ball of the foot, degrees, in (0,
     * 90].
     */
    heel: number;
  }

  /**
   * A bilateral snow glide on an authored plane containing the entered support.
   * The author stages the boots on the slope before entering.
   */
  export interface ISnowGlideParams extends IGlideParams {
    /** An alpine change between opposing ski edges during the glide. */
    edgeTransfer?: ISkiEdgeTransfer;

    /** A Nordic pole stroke and its opposite ski kick. */
    nordic?: INordicStroke;

    /**
     * Descent angle in degrees along the entry heading, in [-20, 20]. Absent is
     * level.
     */
    grade?: number;

    /**
     * Scene subject id of the slope the skis glide on, whose surface descends
     * at `grade`; required with a nonzero grade, and absent on level snow,
     * where the skis bear on the ground.
     */
    slope?: string;
  }

  /** One selected set of ski edges and the opposite set after an unweighting. */
  export interface ISkiEdgeTransfer {
    /** Initial edges, with a cant signed about the ski's forward axis. */
    first: IBladeEdge;

    /** Edges on the other side, with the opposite signed cant. */
    next: IBladeEdge;

    /** Second when the skis pass through flat between the edges. */
    at: number;

    /** Maximum opposite chest twist relative to the carried pelvis, degrees. */
    counter: number;
  }

  /** A Nordic pole catch and a brief kick of the opposite ski. */
  export interface INordicStroke {
    /** The hand that keeps the pole grip through the push. */
    hand: AutoMovieHumanSide;

    /** Scene subject id of the pole. */
    on: string;

    /** A named moving contact frame on the pole. */
    grip: string;

    /** Action seconds of pole catch and release, ordered inside the glide. */
    window: IWindow;

    /** Rearward distance of the kicking ski before it recovers, metres. */
    kick: number;
  }

  /** The start and end action seconds of one authored movement phase. */
  export interface IWindow {
    /** The phase's start, seconds from the action's beginning. */
    readonly start: number;

    /** The phase's end, seconds from the action's beginning. */
    readonly end: number;
  }

  /**
   * Stepping between two supports that may move, such as from a fixed landing
   * onto an escalator tread or a walkway band and off it again: each foot bears
   * on the support it stands on, and the feet that leave one support land on
   * the other.
   */
  export interface ISupportStepParams {
    /**
     * World target at the step's start, metres: the arrival point as it stands
     * then.
     */
    to: IAutoMovieVector3;

    /**
     * Scene subject id of the support the feet start on; the fixed ground when
     * absent.
     */
    from?: string;

    /**
     * Scene subject id of the support the feet arrive on; the fixed ground when
     * absent.
     */
    onto?: string;
  }
  /**
   * A ride on an externally animated board after both feet are on its deck,
   * such as a skateboard, an escalator tread or a walkway band, optionally with
   * a hand on a point of that same support, such as the handrail that moves
   * with an escalator's steps.
   */
  export interface IBoardRideParams {
    /** Scene subject id of the board on which both feet bear. */
    on: string;

    /**
     * Duration in seconds, positive. No natural value is defined: choose it for
     * the beat (provisional, missing).
     */
    duration: number;

    /**
     * The point of the same support each named hand grips while riding, by the
     * support's point id. No grip when absent.
     */
    hands?: Partial<Record<AutoMovieHumanSide, string>>;
  }

  /**
   * A rolling skateboard take through a ground push, stance change, tail pop,
   * landing and supported recovery.
   */
  export interface ISkateboardPhraseParams {
    /** Scene id of the skateboard with deck, stance, tail and wheel affordances. */
    on: string;

    /** Duration in seconds on the actor's clock. */
    duration: number;

    /** The foot that remains forward while the other foot pushes. */
    lead: AutoMovieHumanSide;

    /**
     * Elevation in metres of the skateboard's horizontal ground. Defaults to
     * zero.
     */
    ground?: number;
  }

  /** A surfboard entry, paddle and timed transfer from palms to the stance feet. */
  export interface ISurfboardPhraseParams {
    /** Scene id of the surfboard with deck, palm and stance affordances. */
    on: string;

    /** Duration in seconds on the actor's clock. */
    duration: number;

    /** The foot that reaches the front stance first. */
    lead: AutoMovieHumanSide;

    /**
     * Whether a foot settles before both hands release or after a free
     * interval.
     */
    transfer: SurfboardTransfer;

    /** Elevation in metres of the water surface. Defaults to zero. */
    water?: number;
  }

  /**
   * The order of a surfboard pop-up's palm release and stance acquisition:
   * `overlap` sets a foot down before both palms release, `flight` releases
   * both palms before a foot lands.
   */
  export type SurfboardTransfer = "overlap" | "flight";
}
