import { IAutoMovieCameraAction } from "../harness/IAutoMovieCameraAction";
import { IAutoMovieNodeTarget } from "../harness/IAutoMovieNodeTarget";
import { IAutoMoviePointTarget } from "../harness/IAutoMoviePointTarget";

/**
 * Camera grammar shared by the hero intent and every alternate take.
 *
 * `framing` and `move` are the same closed vocabulary a `frame` action uses,
 * so a plan and the performance that realizes it cannot drift apart. For the
 * hero intent, `performShot` compares `framing` and `move` with the first
 * `frame` action; `blockBeat` checks only that a node `on` target is placed,
 * and no gate compares it with the performed frame subject.
 *
 * @evidence contracts/common.md#principled-implementation Types `framing` and `move` as indexed accesses into `IAutoMovieCameraAction`, so the compile-time vocabulary has one owner, and restricts `on` to a node or a fixed point because a plan names one subject while group subjects belong to the frame action that measures them.
 * @evidence contracts/common.md#clear-and-simple-design Three fields carry the whole intent; the camera id lives only on `IAutoMovieBlockingCoverage`, because the hero camera is elected by the performance's first `frame` action rather than named by the plan.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The documented gap stays visible: the hero `on` is checked for placement only and never compared with the performed subject, instead of being claimed as verified.
 * @evidence contracts/common.md#meaningful-documentation States the shared vocabulary, which gates read each field for the hero and for a coverage take, what an `on` node may name, and the subject comparison gap.
 * @author Samchon
 */
export interface IAutoMovieBlockingCamera {
  /** Shot size the compiled camera must deliver, in `frame` vocabulary. */
  framing: IAutoMovieCameraAction["framing"];

  /** Move family the compiled camera path takes, in `frame` vocabulary. */
  move: IAutoMovieCameraAction["move"];

  /**
   * What the camera favors: a staged actor, set piece or camera by id, or a
   * fixed world point. A node id must name something the staged set places.
   */
  on: IAutoMovieNodeTarget | IAutoMoviePointTarget;
}
