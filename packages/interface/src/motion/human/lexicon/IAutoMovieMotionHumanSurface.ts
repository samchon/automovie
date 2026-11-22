import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Authoring inputs for the surface motion laws. A glide shapes a travel path
 * from the performer's entry, while a ride preserves the foot placements on
 * a separately animated deck.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the activities and who owns each support's motion.
 * @evidence contracts/development/design.md#principled-representation Separates performer travel parameters from an existing rigid prop reference.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameter records of HumanSurface.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses seconds, metres per second and degrees without input defaults that depend on a render frame rate.
 */
export namespace IAutoMovieMotionHumanSurface {
  /**
   * One displayed contact point and the equipment's forward direction at it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the world frame and the meaning of both vectors.
   * @evidence contracts/development/design.md#principled-representation A point and a tangent let the contact measure distinguish forward travel and transverse drift.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The geometry the glide measurement reads for each of two samples.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Measurements consume geometry from the displayed pose or prop, so this record carries no requested pose.
   */
  export interface IGlideSample {
    /** The displayed point on the sole, blade or ski, in world metres. */
    point: IAutoMovieVector3;

    /** Forward along the displayed equipment, a nonzero world direction. */
    forward: IAutoMovieVector3;
  }

  /**
   * An oriented contact plane for measuring a glide.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies a point and outward normal.
   * @evidence contracts/development/design.md#principled-representation A point with one normal defines exactly one planar surface.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Used with two rendered samples in the glide measurement.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Accepts the actual scene plane rather than assuming a horizontal floor.
   */
  export interface IGlidePlane {
    /** Any point on the support surface, in world metres. */
    point: IAutoMovieVector3;

    /** Nonzero world direction pointing out of the surface. */
    normal: IAutoMovieVector3;
  }

  /**
   * The signed components of displayed surface travel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member specifies its sign, unit and reading interval.
   * @evidence contracts/development/design.md#principled-representation One normal reading plus two tangent-plane displacement components.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returns the three quantities to compare with the declared contact mode.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries measurements without asserting which behavior a fixture allowed.
   */
  export interface IGlideMeasure {
    /** Displacement between samples along the equipment, in metres. */
    along: number;

    /** Signed sideways displacement between samples, in metres, positive right. */
    across: number;

    /** Normal gap at the last sample, in metres, negative for penetration. */
    gap: number;
  }

  /**
   * A glide path with an optional arc and deceleration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bilateral starting support and the unit of each path parameter.
   * @evidence contracts/development/design.md#principled-representation One signed total turn over the traversed arc and one starting speed determine a kinematic path.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Controls the glide from the entered position and heading.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The outcome of the deceleration is declared separately from path turn and carries no fabricated friction figure.
   */
  export interface IGlideParams {
    /** Duration in seconds, positive. */
    seconds: number;

    /** Travel speed in metres per second, positive. Approached from the entry speed. */
    speed: number;

    /** Signed total turn in degrees relative to entry heading, in [-180, 180]. Absent is straight. */
    turn?: number;

    /** Decelerate to rest by the end of the action. Absent finishes at travel speed. */
    stop?: boolean;
  }

  /**
   * A pushed glide on two skates with optional real blade-edge contacts
   * and one foot's timed release and recovery.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the optional edge and footwork controls in the ice-only form.
   * @evidence contracts/development/design.md#principled-representation The glide path and the changes of each foot's contact are independent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Adds optional ice-specific controls to the existing skate law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller supplies the actual edge points in foot coordinates.
   */
  export interface ISkateParams extends IGlideParams {
    /** Cant about each skate's forward axis through its selected runner edge. */
    edge?: IBladeEdge;

    /** Release and replace one skate during the glide. */
    step?: ISkateStep;
  }

  /**
   * The selected physical edge on each runner with its signed cant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the local point and angle convention.
   * @evidence contracts/development/design.md#principled-representation A rotation and a pivot for each of two rigid feet.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the cant and edge points the foot goals consume.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical locations come from the attached equipment rather than from a presumed blade width.
   */
  export interface IBladeEdge {
    /** Signed rotation about each foot's +Z direction, in degrees, in [-90, 90]. */
    degrees: number;

    /** Left and right edge locations in their respective foot joint frames, metres. */
    pivots: Readonly<Record<AutoMovieHumanSide, IAutoMovieVector3>>;
  }

  /**
   * One supported skate step, including a crossover when the offset reaches
   * the opposite side. The other skate glides throughout.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States timing, directions and the two supports.
   * @evidence contracts/development/design.md#principled-representation The foot has an ordered release and acquisition with one flight path in the moving stance.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The side, window and displacement used by the skate planner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A crossover changes the actual endpoint of the foot instead of hiding it in the root path.
   */
  export interface ISkateStep {
    /** Side of the released foot. */
    side: AutoMovieHumanSide;

    /** Action seconds at release and reacquisition. */
    window: readonly [number, number];

    /** Metres of displacement along the moving stance's +X and forward +Z. */
    offset: Readonly<IStepOffset>;

    /** Peak height above the original runner plane, metres. */
    clearance: number;
  }

  /**
   * A released skate's displacement on the ice plane of its moving stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the stance frame, its two horizontal axes and metres.
   * @evidence contracts/development/design.md#principled-representation Two horizontal components leave the height to the step's own clearance and the ice plane.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The displacement `ISkateStep.offset` gives the skate planner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No vertical component exists, so a step cannot move the runner off its plane through the offset.
   */
  export interface IStepOffset {
    /** Metres along the moving stance's +X. */
    x: number;

    /** Metres along the moving stance's forward +Z. */
    z: number;
  }

  /**
   * A flat-foot curling delivery with a lowered pelvis and a trailing
   * shoe hinged around its forefoot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents slide timing, the lead shoe and the trailing shoe.
   * @evidence contracts/development/design.md#principled-representation Straight travel plus the separately authored height and stance parameters.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Options of the curling delivery law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The bearing front sole and trailing forefoot replace skate-edge controls for this stance.
   */
  export interface ICurlDeliveryParams {
    /** Positive duration in seconds. */
    seconds: number;

    /** Positive forward glide speed in metres per second. */
    speed: number;

    /** Ease to a stop and recover upright by the end. */
    stop?: boolean;

    /** Side whose flat shoe carries the delivery. */
    lead: AutoMovieHumanSide;

    /** Additional pelvis drop below the ordinary glide, metres. */
    drop: number;

    /** Distance each shoe travels from the entry stance, forward for the leading shoe and backward for the trailing shoe, metres. */
    trail: number;

    /** Trailing heel lift by pitch around the ball of the foot, degrees, in (0, 90]. */
    heel: number;
  }

  /**
   * A bilateral snow glide on an authored plane containing the entered
   * support. The author stages the boots on the slope before entering.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the slope premise, grade sign and entry requirement.
   * @evidence contracts/development/design.md#principled-representation The glide path adds a slope and distinguishes alpine edge transfer from a Nordic pole and ski stroke.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Uses only the snow plane and the authored alpine or Nordic phase controls.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An authored grade changes the path geometry without implying measured friction or ski loads.
   */
  export interface ISnowGlideParams extends IGlideParams {
    /** An alpine change between opposing ski edges during the glide. */
    edgeTransfer?: ISkiEdgeTransfer;

    /** A Nordic pole stroke and its opposite ski kick. */
    nordic?: INordicStroke;

    /** Descent angle in degrees along the entry heading, in [-20, 20]. Absent is level. */
    grade?: number;
  }

  /**
   * One selected set of ski edges and the opposite set after an unweighting.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents both sets, the time of the flat passage and the counter-rotation.
   * @evidence contracts/development/design.md#principled-representation Two mounted edge poses, a neutral time and a relative torso rotation on the same glide.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The alpine branch of snowGlide.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads mounted equipment and uses opposite signs to distinguish the two phases.
   */
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

  /**
   * A Nordic pole catch and a brief kick of the opposite ski.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the pole and its contact window and the opposite ski's stroke distance.
   * @evidence contracts/development/design.md#principled-representation A side and prop reference identify one grip throughout a timed window, coupled to an opposite-side ski displacement.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The Nordic branch of snowGlide.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads the real prop contact, so the author retains ownership of the pole path.
   */
  export interface INordicStroke {
    /** The hand that keeps the pole grip through the push. */
    hand: AutoMovieHumanSide;

    /** Scene subject id of the pole. */
    on: string;

    /** A named moving contact frame on the pole. */
    grip: string;

    /** Action seconds of pole catch and release, ordered inside the glide. */
    window: readonly [number, number];

    /** Rearward distance of the kicking ski before it recovers, metres. */
    kick: number;
  }

  /**
   * Stepping between two supports that may move, such as from a fixed
   * landing onto an escalator tread or a walkway band and off it again:
   * each foot bears on the support it stands on, and the feet that leave
   * one support land on the other.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two supports, the world target and its frame.
   * @evidence contracts/development/design.md#principled-representation A world target at the step's start and two optional scene ids; the fixed ground when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `HumanSupportStep`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The supports' motion belongs to the scene; the target is where the arrival point is at the step's start.
   */
  export interface ISupportStepParams {
    /** World target at the step's start, metres: the arrival point as it stands then. */
    to: IAutoMovieVector3;

    /** Scene subject id of the support the feet start on; the fixed ground when absent. */
    from?: string;

    /** Scene subject id of the support the feet arrive on; the fixed ground when absent. */
    onto?: string;
  }
  /**
   * A ride on an externally animated board after both feet are on its deck,
   * such as a skateboard, an escalator tread or a walkway band, optionally
   * with a hand on a point of that same support, such as the handrail that
   * moves with an escalator's steps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two entry contacts, the optional hand grips and who drives the support.
   * @evidence contracts/development/design.md#principled-representation A scene id selects the support whose film-clock transform carries the stance and every grip point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The support id, the time the stance is carried and the hands' points on the same support.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ride consumes the real board placement. It has no separate parameters for a scripted shadow of the board, and a grip names a point of the support rather than a world position.
   */
  export interface IBoardRideParams {
    /** Scene subject id of the board on which both feet bear. */
    on: string;

    /** Duration in seconds, positive. */
    seconds: number;

    /** The point of the same support each named hand grips while riding, by the support's point id. No grip when absent. */
    hands?: Partial<Record<AutoMovieHumanSide, string>>;
  }

  /**
   * A rolling skateboard take through a ground push, stance change,
   * tail pop, landing and supported recovery.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the support, staged phases and units.
   * @evidence contracts/development/design.md#principled-representation One scene board and clock coordinate distinct support phases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The board id, duration, stance and ground height used by the skateboard law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The author retains ownership of the actual board path.
   */
  export interface ISkateboardPhraseParams {
    /** Scene id of the skateboard with deck, stance, tail and wheel affordances. */
    on: string;

    /** Duration in seconds on the actor's clock. */
    seconds: number;

    /** The foot that remains forward while the other foot pushes. */
    lead: AutoMovieHumanSide;

    /** Elevation in metres of the skateboard's horizontal ground. Defaults to zero. */
    ground?: number;
  }

  /**
   * A surfboard entry, paddle and timed transfer from palms to the stance feet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the board and entry, both support transfer modes and units.
   * @evidence contracts/development/design.md#principled-representation Two distinct release versus acquisition orders use the same authored board clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The board id, duration, lead side, transfer and waterline used by the surfing law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All grip and stance targets use the posed board.
   */
  export interface ISurfboardPhraseParams {
    /** Scene id of the surfboard with deck, palm and stance affordances. */
    on: string;

    /** Duration in seconds on the actor's clock. */
    seconds: number;

    /** The foot that reaches the front stance first. */
    lead: AutoMovieHumanSide;

    /** Whether a foot settles before both hands release or after a free interval. */
    transfer: SurfboardTransfer;

    /** Elevation in metres of the water surface. Defaults to zero. */
    water?: number;
  }

  /**
   * The order of a surfboard pop-up's palm release and stance acquisition:
   * `overlap` sets a foot down before both palms release, `flight` releases
   * both palms before a foot lands.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines both transfer orders by their support events.
   * @evidence contracts/development/design.md#principled-representation A closed literal union of the two support orders the surfing law plans.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `ISurfboardPhraseParams.transfer` and the surfboard phrase planner consume it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The union admits no third order that the planner would have to guess.
   */
  export type SurfboardTransfer = "overlap" | "flight";
}
