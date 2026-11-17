import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanActionContext } from "./IAutoMovieMotionHumanActionContext";

/**
 * A capability for reading another performer's body, resolved bones, root and optional posture at film instants. Action planning uses this resolved view separately from authored performer configuration.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A capability for reading another performer's body, resolved bones, root and optional posture at film instants. Action planning uses this resolved view separately from authored performer configuration.
 * @evidence contracts/development/design.md#principled-representation posture: Their placed posture at a film second, read under the same rule as `root`: the posture their active action writes, before layers and the decaying offset of a cut. An instanced member displays it moved (`instance`). Absent where the context reads no placed path.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ActionContext.performer supplies resolved body/bones/root/posture queries to interaction laws, while IAutoMovieMotionHumanPerformer remains the authored configuration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Queries take film seconds and expose the original Map ownership; the performance reader owns evaluation and recursion handling. No SDK skeleton handle enters the contract.
 */
export interface IAutoMovieMotionHumanPerformerReader {
  /** Their body. */
  body: IAutoMovieMotionHumanBody;

  /**
   * Their displayed world bones at a film second.
   *
   * @param seconds Film seconds.
   * @returns Resolved bones by rig bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformerReader.bones: Their displayed world bones at a film second.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformerReader.bones is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformerReader.bones is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformerReader.bones is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformerReader.bones is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformerReader.bones is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformerReader.bones is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   */
  bones(seconds: number): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /**
   * Where their placed actions put their root at a film second, readable while a law plans: a follower, an escort or an interception plans its own path from where the other will be, not from where they stood when it began.
   *
   * It is the root their active action writes (the point a law places a body by, as its own `entry.posture.root` is: carried within the pelvis, a few centimetres from the pelvis joint on the floor plan), before layers and before the decaying offset of a cut, so it costs one posture of theirs and reads no pose. Before their first action it is their starting place, and after their last it is where that action left them.
   *
   * The other's path is known only as far as the composition has placed it, in the order the composition is written (a sequence part by part, a parallel group part by part), so the person read is composed before the one who reads.
   *
   * @param seconds Film seconds.
   * @returns Their root.
   * @throws {HumanRefusal} A `participant` refusal when the second lies after their last placed action while later actions of theirs are still to be placed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformerReader.root: Where their placed actions put their root at a film second, readable while a law plans: a follower, an escort or an interception plans its own path from where the other will be, not from where they stood when it began. It is the root their active action writes (the point a law places a body by, as its own `entry.posture.root` is: carried within the pelvis, a few centimetres from the pelvis joint on the floor plan), before layers and before the decaying offset of a cut, so it costs one posture of theirs and reads no pose. Before their first action it is their starting place, and after their last it is where that action left them. The other's path is known only as far as the composition has placed it, in the order the composition is written (a sequence part by part, a parallel group part by part), so the person read is composed before the one who reads.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformerReader.root is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformerReader.root is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformerReader.root is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformerReader.root is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformerReader.root is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformerReader.root is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   */
  root(seconds: number): IAutoMovieMotionHumanActionContext.IRoot;

  /**
   * Their placed posture at a film second, read under the same rule as
   * `root`: the posture their active action writes, before layers and the decaying offset of a cut. An instanced member displays it moved (`instance`). Absent where the context reads no placed path.
   *
   * @param seconds Film seconds.
   * @returns Their posture.
   * @throws {HumanRefusal} As `root` does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformerReader.posture: Their placed posture at a film second, read under the same rule as `root`: the posture their active action writes, before layers and the decaying offset of a cut. An instanced member displays it moved (`instance`). Absent where the context reads no placed path.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformerReader.posture is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformerReader.posture is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformerReader.posture is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformerReader.posture is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformerReader.posture is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformerReader.posture is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   */
  posture?(seconds: number): IAutoMovieMotionHumanPosture;
}
