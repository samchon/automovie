import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanActionContext } from "./IAutoMovieMotionHumanActionContext";

/**
 * A capability for reading another performer's body, resolved bones, root and
 * optional posture at film instants. Action planning uses this resolved view
 * separately from authored performer configuration.
 */
export interface IAutoMovieMotionHumanPerformerReader {
  /** Their body. */
  body: IAutoMovieMotionHumanBody;

  /**
   * Their displayed world bones at a film second.
   *
   * @param seconds Film seconds.
   * @param requested Optional observed bone names; omission requests the
   *   complete displayed hierarchy.
   * @returns Fresh resolved bones by rig bone, containing only requested
   *   reachable bones when supplied.
   */
  bones(
    seconds: number,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /**
   * Where their placed actions put their root at a film second, readable while
   * a law plans: a follower, an escort or an interception plans its own path
   * from where the other will be, not from where they stood when it began.
   *
   * It is the root their active action writes (the point a law places a body
   * by, as its own `entry.posture.root` is: carried within the pelvis, a few
   * centimetres from the pelvis joint on the floor plan), before layers and
   * before the decaying offset of a cut, so it costs one posture of theirs and
   * reads no pose. Before their first action it is their starting place, and
   * after their last it is where that action left them.
   *
   * The other's path is known only as far as the composition has placed it, in
   * the order the composition is written (a sequence part by part, a parallel
   * group part by part), so the person read is composed before the one who
   * reads.
   *
   * @param seconds Film seconds.
   * @returns Their root.
   * @throws {HumanRefusal} A `participant` refusal when the second lies after
   *   their last placed action while later actions of theirs are still to be
   *   placed.
   */
  root(seconds: number): IAutoMovieMotionHumanActionContext.IRoot;

  /**
   * Their placed posture at a film second, read under the same rule as `root`:
   * the posture their active action writes, before layers and the decaying
   * offset of a cut. An instanced member displays it moved (`instance`). Absent
   * where the context reads no placed path.
   *
   * @param seconds Film seconds.
   * @returns Their posture.
   * @throws {HumanRefusal} As `root` does.
   */
  posture?(seconds: number): IAutoMovieMotionHumanPosture;
}
