import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanProp } from "../perform/IAutoMovieMotionHumanProp";
import type { IAutoMovieMotionPropLaunch } from "./IAutoMovieMotionPropLaunch";

/**
 * A capability for reading a performance prop and its world frame at film instants, with optional articulation state. Action planning reads this view instead of owning prop placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A capability for reading a performance prop and its world frame at film instants, with optional articulation state. Action planning reads this view instead of owning prop placement.
 * @evidence contracts/development/design.md#principled-representation state: The travel of each of its articulations an act or its own track has moved by a film second (`HumanPerformance.state`); an articulation absent from the record is at rest. Read at plan time like `frame`, so an act that operates a part starts from where the part is. Absent from a context that tracks no state, where every articulation is at rest.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ActionContext.prop supplies a prop and its evaluated frame/state to manipulation and other interaction laws; authored prop geometry remains in IAutoMovieMotionHumanProp.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Frame queries use film seconds and return a world rigid transform; articulation state is a readonly named-number view. Performance prop readers own lookup, placement and admission.
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
   * The original launch publication displaying the prop at a film second, if the reader tracks flights and one still owns the prop.
   */
  launchAt?(seconds: number): IAutoMovieMotionPropLaunch | undefined;

  /**
   * The selected launch and two displayed frames from one collision search bounded by the later film second.
   *
   * @param seconds The later film second, at interception.
   * @param before An earlier film second on the same launch to read for its approach.
   * @returns The launch identity and both world frames, if this flight owns both samples.
   */
  flightApproach?(
    seconds: number,
    before: number,
  ): IAutoMovieMotionHumanPropReader.IFlightApproach | undefined;

  /**
   * The prop socket currently carrying this prop, if a socket is its displayed carrier at these film seconds.
   */
  mountAt?(
    seconds: number,
  ): Pick<IAutoMovieMotionHumanProp.IMounted, "prop" | "point"> | undefined;

  /**
   * The performer's hand holding this prop at a film second, if a hand is its displayed carrier then: the same grip custody the frame is read by, so a law can ask who is armed instead of guessing from distances.
   *
   * @param seconds Film seconds.
   * @returns The holding performer and hand, or none when no hand holds it.
   */
  holderAt?(seconds: number): IAutoMovieMotionHumanPropReader.IHolder | undefined;

  /**
   * The travel of each of its articulations an act or its own track has moved by a film second (`HumanPerformance.state`); an articulation absent from the record is at rest. Read at plan time like `frame`, so an act that operates a part starts from where the part is. Absent from a context that tracks no state, where every articulation is at rest.
   *
   * @param seconds Film seconds.
   * @returns Travel by articulation id.
   */
  state?(seconds: number): Readonly<Record<string, number>>;
}

/** The data returned by a prop reader that observes the same approaching launch twice. */
export namespace IAutoMovieMotionHumanPropReader {
  /**
   * Two world frames of the same placed launch before and at interception.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the borrowed publication and the ordering and frames of the samples.
   * @evidence contracts/development/design.md#principled-representation One launch identity pairs two world frames selected by the same collision horizon.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the samples needed by the catch law without the sweep or continuation data.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries the published identity rather than reconstructing a launch.
   */
  export interface IFlightApproach {
    /** The borrowed, original publication. */
    launch: IAutoMovieMotionPropLaunch;
    /** The prop's displayed world frame at the later time. */
    frame: IAutoMovieRigidTransform;
    /** The prop's displayed world frame at the earlier time. */
    before: IAutoMovieRigidTransform;
  }

  /**
   * The hand that holds a prop at a film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the performer and the hand.
   * @evidence contracts/development/design.md#principled-representation A performer's subject and one side identify a holding hand.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the holder a law asks for without the grip's spans or offsets.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the subject and side vocabulary of the grips.
   */
  export interface IHolder {
    /** The holding performer's subject. */
    subject: string;
    /** The holding hand. */
    side: AutoMovieHumanSide;
  }
}
