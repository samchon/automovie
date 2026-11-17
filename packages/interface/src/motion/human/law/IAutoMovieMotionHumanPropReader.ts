import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieMotionHumanProp } from "../perform/IAutoMovieMotionHumanProp";

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
