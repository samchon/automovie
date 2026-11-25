import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanProp } from "../perform/IAutoMovieMotionHumanProp";
import type { IAutoMovieMotionPropLaunch } from "./IAutoMovieMotionPropLaunch";

/**
 * A capability for reading a performance prop and its world frame at film
 * instants, with optional articulation state. Action planning reads this view
 * instead of owning prop placement.
 */
export interface IAutoMovieMotionHumanPropReader {
  /** The prop as declared. */
  prop: IAutoMovieMotionHumanProp;

  /**
   * Its displayed world frame at a film second.
   *
   * @param seconds Film seconds.
   * @returns The frame.
   */
  frame(seconds: number): IAutoMovieRigidTransform;

  /**
   * The displayed frame and prop-local geometry at one film second. Read
   * during preparation only when a law needs the posed material geometry.
   *
   * @param seconds Film seconds.
   * @returns The displayed frame and the posed affordances and colliders.
   */
  snapshot?(seconds: number): IAutoMovieMotionHumanPropReader.ISnapshot;

  /**
   * A named contact's displayed world frame, including its placed articulation.
   * Uses the same prop placement as {@link frame}.
   *
   * @param id The prop's point or affordance name.
   * @param seconds Film seconds.
   * @returns The named frame.
   */
  site?(id: string, seconds: number): IAutoMovieRigidTransform;

  /**
   * The original launch publication displaying the prop at a film second, if
   * the reader tracks flights and one still owns the prop.
   */
  launchAt?(seconds: number): IAutoMovieMotionPropLaunch | undefined;

  /**
   * The selected launch and two displayed frames from one collision search
   * bounded by the later film second.
   *
   * @param seconds The later film second, at interception.
   * @param before An earlier film second on the same launch to read for its
   *   approach.
   * @returns The launch identity and both world frames, if this flight owns
   *   both samples.
   */
  flightApproach?(
    seconds: number,
    before: number,
  ): IAutoMovieMotionHumanPropReader.IFlightApproach | undefined;

  /**
   * The prop socket currently carrying this prop, if a socket is its displayed
   * carrier at these film seconds.
   */
  mountAt?(
    seconds: number,
  ): Pick<IAutoMovieMotionHumanProp.IMounted, "prop" | "point"> | undefined;

  /**
   * The performer's hand holding this prop at a film second, if a hand is its
   * displayed carrier then: the same grip custody the frame is read by, so a
   * law can ask who is armed instead of guessing from distances.
   *
   * @param seconds Film seconds.
   * @returns The holding performer and hand, or none when no hand holds it.
   */
  holderAt?(
    seconds: number,
  ): IAutoMovieMotionHumanPropReader.IHolder | undefined;

  /**
   * The travel of each of its articulations an act or its own track has moved
   * by a film second (`HumanPerformance.state`); an articulation absent from
   * the record is at rest. Read at plan time like `frame`, so an act that
   * operates a part starts from where the part is. Absent from a context that
   * tracks no state, where every articulation is at rest.
   *
   * @param seconds Film seconds.
   * @returns Travel by articulation id.
   */
  state?(seconds: number): Readonly<Record<string, number>>;
}

/** Observations a prop reader can return. */
export namespace IAutoMovieMotionHumanPropReader {
  /** A prop's displayed placement and local material at one film second. */
  export interface ISnapshot {
    /** The prop's displayed world frame. */
    frame: IAutoMovieRigidTransform;

    /** Its posed affordances and colliders in that frame. */
    posed: IAutoMovieMotionHumanProp.IPosed;
  }

  /** Two world frames of the same placed launch before and at interception. */
  export interface IFlightApproach {
    /** The borrowed, original publication. */
    launch: IAutoMovieMotionPropLaunch;
    /** The prop's displayed world frame at the later time. */
    frame: IAutoMovieRigidTransform;
    /** The prop's displayed world frame at the earlier time. */
    before: IAutoMovieRigidTransform;
  }

  /** The hand that holds a prop at a film second. */
  export interface IHolder {
    /** The holding performer's subject. */
    subject: string;
    /** The holding hand. */
    side: AutoMovieHumanSide;
  }
}
