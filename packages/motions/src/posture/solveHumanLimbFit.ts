import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLimbFitFrame,
  IAutoMoviePose,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmMirror } from "./HumanArmMirror";
import { HumanLimbFit } from "./HumanLimbFit";
import { HumanLimbFitFrame } from "./HumanLimbFitFrame";
import { HumanLimbIncumbent } from "./HumanLimbIncumbent";
import { HumanLimbMirror } from "./HumanLimbMirror";
import { HumanLimbView } from "./HumanLimbView";
import { mirrorHumanLimbSource } from "./mirrorHumanLimbSource";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

/**
 * Solve one limb fit directly, every time, with no memory of earlier fits.
 *
 * The fit runs on the records it reads and no others (`HumanLimbView.of`):
 * its chain's, its attachment's and its colliders' bones with their
 * ancestors, which place every bone it reads where the whole pose does. A
 * left limb is solved as the right limb in the mirror image of that reduced
 * pose and its world and mirrored back, so the two sides are mirror images
 * to the bit. The solve runs in the root-position frame
 * (`HumanLimbFitFrame`): the pose root, goal point and bend and the other
 * arm's wrist are moved by minus the root's position and turned by minus its
 * heading, so one body doing the same thing in another place solves the same
 * numbers. The solved records are written back into the whole pose
 * (`HumanLimbView.merged`), whose other records and root stay the caller's
 * own objects. The whole pose is admitted in order once, before the fit's
 * first forward-kinematics read (`HumanLimbView.admitted`).
 *
 * @param body The performer's body.
 * @param pose The pose before the fit.
 * @param limb The limb.
 * @param goal Its goal, attached or not.
 * @param placed The arms already placed.
 * @param rival Where the other arm's wrist will be, while it is still to be fitted.
 * @param near A nearby fit of the same limb to continue; omitted, the fit is solved cold.
 * @param resolution Optional FK reader or lazy supplier borrowed from the caller's synchronous evaluation.
 * @param policy The ordinary fit, or the owned continuous curve's current hinged correction.
 * @param admission The admission the fits of one pose share (`HumanLimbView.IAdmission`); absent, this fit admits the whole pose itself.
 * @returns The pose with the limb fitted, the seed that continues it and its value; records the fit leaves unchanged are shared with the input pose, which callers treat as immutable.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the reduction, the mirror and frame conventions, the admission, the absence of memory, the two policies and the shared-record ownership of the result.
 * @evidence contracts/development/implementation.md#principled-implementation A bone's frame depends on its own and its ancestors' records, so the reduced pose places the fit's bones as the whole pose does; mirror reflection and a rigid root-frame move leave a limb fit equivariant; the mirror, the frame and the fit are the ones that ran on the whole pose, applied to fewer records.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reduce, mirror, move into the frame, one solve by `HumanLimbFit.direct`, merge the solved records back.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No key, lookup or stored answer: every request is solved from its own inputs, and an attached or collider goal stays in the world frame as before. A malformed record outside the reduced pose is still refused, by the whole pose's admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms The fit's own work on the reduced pose's records, plus two walks of the whole pose's joints (the selection and the merge) and its one admission, shared by the fits that share an admission; no copy of the whole pose is mirrored, moved or scanned by the fit.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Solves each request afresh; an admission is shared only by fits whose poses differ by records earlier fits solved.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the borrowed reader stays with its caller and only the result escapes.
 */
export function solveHumanLimbFit(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  limb: AutoMovieHumanLimb,
  goal: IAutoMovieHumanLimbGoal,
  placed: readonly ("left" | "right")[],
  rival?: IAutoMovieVector3,
  near?: IAutoMovieSwivelNear,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  policy: "ordinary" | "continuous" = "ordinary",
  admission?: HumanLimbView.IAdmission,
): IAutoMovieSeededChainFit {
  return solved(body, pose, limb, goal, placed, rival, near, resolution, policy, true, admission);
}

/**
 * The same solve without the root-position frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the world-frame entry and who reads it.
 * @evidence contracts/development/design.md#principled-representation The frame a fit is solved in is the entry's, not a flag a caller sets on a result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One entry, read by `HumanLimbFit.fit` and `HumanLimbFit.continued`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the reduction, the mirror and the merge with the framed solve.
 */
export namespace solveHumanLimbFit {
  /**
   * Solve one limb fit in the world frame the pose is given in: the reduced
   * pose, a left limb's mirror image and the merge of
   * {@link solveHumanLimbFit}, without its root-position frame. `HumanLimbFit.fit` and `HumanLimbFit.continued` are
   * this solve.
   */
  export function world(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limb: AutoMovieHumanLimb,
    goal: IAutoMovieHumanLimbGoal,
    placed: readonly ("left" | "right")[],
    rival: IAutoMovieVector3 | undefined,
    near: IAutoMovieSwivelNear | undefined,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    policy: "ordinary" | "continuous",
  ): IAutoMovieSeededChainFit {
    return solved(body, pose, limb, goal, placed, rival, near, resolution, policy, false, undefined);
  }
}

/** Reduce, mirror a left limb, move into the frame when asked, solve the right chain, merge back. */
function solved(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  limb: AutoMovieHumanLimb,
  goal: IAutoMovieHumanLimbGoal,
  placed: readonly ("left" | "right")[],
  rival: IAutoMovieVector3 | undefined,
  near: IAutoMovieSwivelNear | undefined,
  resolution: Parameters<typeof prepareHumanPoseResolution>[0],
  policy: "ordinary" | "continuous",
  framed: boolean,
  admission: HumanLimbView.IAdmission | undefined,
): IAutoMovieSeededChainFit {
  const view: HumanLimbView.IView = HumanLimbView.of(body, pose, limb, goal, placed);

  // A left limb is solved as the right limb in the mirror image of its
  // world, so the two sides are mirror images to the bit. The image is read
  // through the operation reader's companion (`mirrorHumanLimbSource`), so
  // neither the pose's rows nor its image's are recomputed for the other's
  // sake.
  const left: boolean = limb.startsWith("left");
  const image: IAutoMoviePose = left ? HumanLimbMirror.pose(view.pose) : view.pose;
  const chain: AutoMovieHumanLimb = left ? HumanLimbMirror.limb(limb) : limb;
  const asked: IAutoMovieHumanLimbGoal = left ? HumanLimbMirror.goal(goal) : goal;
  const others: readonly ("left" | "right")[] = left ? placed.map(HumanLimbMirror.side) : placed;
  const coming: IAutoMovieVector3 | undefined =
    left && rival !== undefined ? HumanArmMirror.flip(rival) : rival;
  const reader: Parameters<typeof prepareHumanPoseResolution>[0] =
    !left || resolution === undefined
      ? resolution
      : (): ReturnType<ReturnType<typeof prepareHumanPoseResolution>> =>
          mirrorHumanLimbSource(prepareHumanPoseResolution.read(resolution));

  // Solved in the root-position frame; the merge keeps the caller's root.
  const frame: IAutoMovieMotionHumanLimbFitFrame.IFrame | null = framed ? HumanLimbFitFrame.of(image, asked) : null;
  const own: IAutoMoviePose = frame === null ? image : HumanLimbFitFrame.pose(frame, image);
  const aim: IAutoMovieHumanLimbGoal = frame === null ? asked : HumanLimbFitFrame.goal(frame, asked);
  const away: IAutoMovieVector3 | undefined =
    frame === null || coming === undefined ? coming : HumanLimbFitFrame.point(frame, coming);
  const out: IAutoMovieSeededChainFit = HumanLimbFit.direct(
    body, own, chain, aim, others, away, near, reader, policy,
    (): void => HumanLimbView.admitted(body, pose, admission),
    // A seed held for this limb (`HumanLimbIncumbent`) starts a swept
    // fit's bounded search; a continued fit has its own seed.
    near === undefined ? HumanLimbIncumbent.of(body, limb) : undefined,
  );

  // The solved records go back into the whole pose, a left limb's renamed
  // to its own side; a leg's toes are replaced where they stand.
  const toes: AutoMovieHumanoidBone | null = chain.endsWith("Leg")
    ? `${chain.startsWith("left") ? "left" : "right"}Toes`
    : null;
  const merged: IAutoMoviePose = HumanLimbView.merged(
    pose, view, image.joints, out.pose.joints, toes,
    left ? HumanLimbMirror.joint : (joint: IAutoMovieJointPose): IAutoMovieJointPose => joint,
  );
  return merged === out.pose ? out : { ...out, pose: merged };
}
