import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
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
 * The fit runs on the records it reads and no others (`HumanLimbView.of`): its
 * chain's, its attachment's and its colliders' bones with their ancestors,
 * which place every bone it reads where the whole pose does. A left limb is
 * solved as the right limb in the mirror image of that reduced pose and its
 * world and mirrored back, so the two sides are mirror images to the bit. The
 * solve runs in the root-position frame (`HumanLimbFitFrame`): the pose root,
 * goal point and bend and the other arm's wrist are moved by minus the root's
 * position and turned by minus its heading, so one body doing the same thing in
 * another place solves the same numbers. The solved records are written back
 * into the whole pose (`HumanLimbView.merged`), whose other records and root
 * stay the caller's own objects. The whole pose is admitted in order once,
 * before the fit's first forward-kinematics read (`HumanLimbView.admitted`).
 *
 * @param body The performer's body.
 * @param pose The pose before the fit.
 * @param limb The limb.
 * @param goal Its goal, attached or not.
 * @param placed The arms already placed.
 * @param rival Where the other arm's wrist will be, while it is still to be
 *   fitted.
 * @param near A nearby fit of the same limb to continue; omitted, the fit is
 *   solved cold.
 * @param resolution Optional FK reader or lazy supplier borrowed from the
 *   caller's synchronous evaluation.
 * @param policy The ordinary fit, or the owned continuous curve's current
 *   hinged correction.
 * @param admission The admission the fits of one pose share
 *   (`HumanLimbView.IAdmission`); absent, this fit admits the whole pose
 *   itself.
 * @returns The pose with the limb fitted, the seed that continues it and its
 *   value; records the fit leaves unchanged are shared with the input pose,
 *   which callers treat as immutable.
 */
export function solveHumanLimbFit(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  limb: AutoMovieHumanLimb,
  goal: IAutoMovieHumanLimbGoal,
  placed: readonly AutoMovieHumanSide[],
  rival?: IAutoMovieVector3,
  near?: IAutoMovieSwivelNear,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  policy: SolveHumanLimbFitPolicy = "ordinary",
  admission?: HumanLimbView.IAdmission,
): IAutoMovieSeededChainFit {
  return solved(
    body,
    pose,
    limb,
    goal,
    placed,
    rival,
    near,
    resolution,
    policy,
    true,
    admission,
  );
}

/** The same solve without the root-position frame. */
export namespace solveHumanLimbFit {
  /**
   * Solve one limb fit in the world frame the pose is given in: the reduced
   * pose, a left limb's mirror image and the merge of {@link solveHumanLimbFit},
   * without its root-position frame. `HumanLimbFit.fit` and
   * `HumanLimbFit.continued` are this solve.
   */
  export function world(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limb: AutoMovieHumanLimb,
    goal: IAutoMovieHumanLimbGoal,
    placed: readonly AutoMovieHumanSide[],
    rival: IAutoMovieVector3 | undefined,
    near: IAutoMovieSwivelNear | undefined,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    policy: SolveHumanLimbFitWorldPolicy,
  ): IAutoMovieSeededChainFit {
    return solved(
      body,
      pose,
      limb,
      goal,
      placed,
      rival,
      near,
      resolution,
      policy,
      false,
      undefined,
    );
  }
}
/**
 * Reduce, mirror a left limb, move into the frame when asked, solve the right
 * chain, merge back.
 */
function solved(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  limb: AutoMovieHumanLimb,
  goal: IAutoMovieHumanLimbGoal,
  placed: readonly AutoMovieHumanSide[],
  rival: IAutoMovieVector3 | undefined,
  near: IAutoMovieSwivelNear | undefined,
  resolution: Parameters<typeof prepareHumanPoseResolution>[0],
  policy: SolvedPolicy,
  framed: boolean,
  admission: HumanLimbView.IAdmission | undefined,
): IAutoMovieSeededChainFit {
  const view: HumanLimbView.IView = HumanLimbView(
    body,
    pose,
    limb,
    goal,
    placed,
  );

  // A left limb is solved as the right limb in the mirror image of its
  // world, so the two sides are mirror images to the bit. The image is read
  // through the operation reader's companion (`mirrorHumanLimbSource`), so
  // neither the pose's rows nor its image's are recomputed for the other's
  // sake.
  const left: boolean = limb.startsWith("left");
  const image: IAutoMoviePose = left
    ? HumanLimbMirror.pose(view.pose)
    : view.pose;
  const chain: AutoMovieHumanLimb = left ? HumanLimbMirror.limb(limb) : limb;
  const asked: IAutoMovieHumanLimbGoal = left
    ? HumanLimbMirror.goal(goal)
    : goal;
  const others: readonly AutoMovieHumanSide[] = left
    ? placed.map(HumanLimbMirror.side)
    : placed;
  const coming: IAutoMovieVector3 | undefined =
    left && rival !== undefined ? HumanArmMirror.flip(rival) : rival;
  const reader: Parameters<typeof prepareHumanPoseResolution>[0] =
    !left || resolution === undefined
      ? resolution
      : (): ReturnType<ReturnType<typeof prepareHumanPoseResolution>> =>
          mirrorHumanLimbSource(prepareHumanPoseResolution.read(resolution));

  // Solved in the root-position frame; the merge keeps the caller's root.
  const frame: IAutoMovieMotionHumanLimbFitFrame.IFrame | null = framed
    ? HumanLimbFitFrame(image, asked)
    : null;
  const own: IAutoMoviePose =
    frame === null ? image : HumanLimbFitFrame.pose(frame, image);
  const aim: IAutoMovieHumanLimbGoal =
    frame === null ? asked : HumanLimbFitFrame.goal(frame, asked);
  const away: IAutoMovieVector3 | undefined =
    frame === null || coming === undefined
      ? coming
      : HumanLimbFitFrame.point(frame, coming);
  const out: IAutoMovieSeededChainFit = HumanLimbFit.direct(
    body,
    own,
    chain,
    aim,
    others,
    away,
    near,
    reader,
    policy,
    (): void => HumanLimbView.admitted(body, pose, admission),
    // A seed held for this limb (`HumanLimbIncumbent`) starts a swept
    // fit's bounded search; a continued fit has its own seed.
    near === undefined ? HumanLimbIncumbent(body, limb) : undefined,
  );

  // The solved records go back into the whole pose, a left limb's renamed
  // to its own side; a leg's toes are replaced where they stand.
  const toes: AutoMovieHumanoidBone | null = chain.endsWith("Leg")
    ? `${chain.startsWith("left") ? "left" : "right"}Toes`
    : null;
  const merged: IAutoMoviePose = HumanLimbView.merged(
    pose,
    view,
    image.joints,
    out.pose.joints,
    toes,
    left
      ? HumanLimbMirror.joint
      : (joint: IAutoMovieJointPose): IAutoMovieJointPose => joint,
  );
  return merged === out.pose ? out : { ...out, pose: merged };
}

/** The alternatives of `SolveHumanLimbFitPolicy`'s site. */
type SolveHumanLimbFitPolicy = "ordinary" | "continuous";
/** The alternatives of `SolveHumanLimbFitWorldPolicy`'s site. */
type SolveHumanLimbFitWorldPolicy = "ordinary" | "continuous";

/** The alternatives of `SolvedPolicy`'s site. */
type SolvedPolicy = "ordinary" | "continuous";
