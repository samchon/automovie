import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

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
   * A bilateral glide on level ice with an optional arc and deceleration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bilateral starting support and the unit of each path parameter.
   * @evidence contracts/development/design.md#principled-representation One signed total turn over the traversed arc and one starting speed determine a kinematic path.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Controls the glide from the entered position and heading.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The outcome of the deceleration is declared separately from path turn and carries no fabricated friction figure.
   */
  export interface ISkateParams {
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
   * A bilateral snow glide on an authored plane containing the entered
   * support. The author stages the boots on the slope before entering.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the slope premise, grade sign and entry requirement.
   * @evidence contracts/development/design.md#principled-representation Shares the glide path controls and adds an inclination to the travel plane.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Adds one number to the ice glide controls.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An authored grade changes the path geometry without implying measured friction or ski loads.
   */
  export interface ISnowGlideParams extends ISkateParams {
    /** Descent angle in degrees along the entry heading, in [-20, 20]. Absent is level. */
    grade?: number;
  }

  /**
   * A ride on an externally animated board after both feet are on its deck.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two entry contacts and who drives the deck.
   * @evidence contracts/development/design.md#principled-representation A scene id selects the support whose film-clock transform carries the stance.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The support id and the time the stance is carried.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ride consumes the real board placement. It has no separate parameters for a scripted shadow of the board.
   */
  export interface IBoardRideParams {
    /** Scene subject id of the board on which both feet bear. */
    on: string;

    /** Duration in seconds, positive. */
    seconds: number;
  }
}
