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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPropReader.frame: Its displayed world frame at a film second.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPropReader.frame is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPropReader.frame is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPropReader.frame is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPropReader.frame is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPropReader.frame is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPropReader.frame is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   */
  frame(seconds: number): IAutoMovieRigidTransform;

  /**
   * The original launch publication displaying the prop at a film second, if the reader tracks flights and one still owns the prop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns the borrowed publication identity for the prop's active flight on the film clock.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The performance reader owns flight selection.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The performance reader supplies the implementation.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This signature contains no computation.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The reader owns traversal and allocation costs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The reader owns any cache and its equivalence rules.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration owns no retained state.
   */
  launchAt?(seconds: number): IAutoMovieMotionPropLaunch | undefined;

  /**
   * The selected launch and two displayed frames from one collision search bounded by the later film second.
   *
   * @param seconds The later film second, at interception.
   * @param before An earlier film second on the same launch to read for its approach.
   * @returns The launch identity and both world frames, if this flight owns both samples.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two film clocks, window, and launch identity and world frame outputs.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The performance reader supplies selection and sampling.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Interface only.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Interface only.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Interface only.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Interface only.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Interface only.
   */
  flightApproach?(
    seconds: number,
    before: number,
  ): IAutoMovieMotionHumanPropReader.IFlightApproach | undefined;

  /**
   * The prop socket currently carrying this prop, if a socket is its displayed carrier at these film seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Declares film seconds and the identity of the active carrier and socket.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The performance reader supplies selection.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Interface only.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Interface only.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Interface only.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Interface only.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Interface only.
   */
  mountAt?(
    seconds: number,
  ): Pick<IAutoMovieMotionHumanProp.IMounted, "prop" | "point"> | undefined;

  /**
   * The performer's hand holding this prop at a film second, if a hand is its displayed carrier then: the same grip custody the frame is read by, so a law can ask who is armed instead of guessing from distances.
   *
   * @param seconds Film seconds.
   * @returns The holding performer and hand, or none when no hand holds it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Declares film seconds and the identity of the holding performer and hand.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The performance reader supplies the grip custody.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Interface only.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Interface only.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Interface only.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Interface only.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Interface only.
   */
  holderAt?(seconds: number): IAutoMovieMotionHumanPropReader.IHolder | undefined;

  /**
   * The travel of each of its articulations an act or its own track has moved by a film second (`HumanPerformance.state`); an articulation absent from the record is at rest. Read at plan time like `frame`, so an act that operates a part starts from where the part is. Absent from a context that tracks no state, where every articulation is at rest.
   *
   * @param seconds Film seconds.
   * @returns Travel by articulation id.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPropReader.state: The travel of each of its articulations an act or its own track has moved by a film second (`HumanPerformance.state`); an articulation absent from the record is at rest. Read at plan time like `frame`, so an act that operates a part starts from where the part is. Absent from a context that tracks no state, where every articulation is at rest.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPropReader.state is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPropReader.state is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPropReader.state is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPropReader.state is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPropReader.state is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPropReader.state is used through packages/motions/src/perform/HumanPerformancePlace.ts.
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
