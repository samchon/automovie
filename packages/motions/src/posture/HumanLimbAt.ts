import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  fitHingedChainAt,
  readHingedChainSeed,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { HumanLimbFit } from "./HumanLimbFit";
import { HumanLimbMirror } from "./HumanLimbMirror";
import { HumanLimbView } from "./HumanLimbView";
import { poseBones } from "./poseBones";

/**
 * A limb posed at a prescribed swivel and bend branch, and the swivel and
 * branch a posed limb has, in the frame its fits' seeds use: the closed-form
 * readings a caller choosing its own swivel (an arm course) needs, with no
 * search, score or continuation.
 *
 * A left limb is read as the right limb of its mirror image (`HumanLimbMirror`)
 * and mirrored back, as `HumanLimbFit.fit` solves it, so its swivel is the one
 * its fits' seeds carry. A goal attached to a bone is carried into the world by
 * the pose first (`HumanLimbFit.world`). The request is the fit's own: the
 * performer's skeleton, topology and the humanoid axis and rest tables, the
 * goal's point, bend and rotation.
 */
export namespace HumanLimbAt {
  /**
   * The limb posed at a swivel and branch.
   *
   * @param body The performer's body.
   * @param pose The pose before the limb is placed.
   * @param limb The limb.
   * @param goal Its goal, attached or not; its point is the end joint's target.
   * @param swivel The swivel, degrees, in the fit's seed frame (a left limb's
   *   in its mirror image).
   * @param branch The bend branch, 0 or 1.
   * @returns The pose with the limb placed, its seed and the shortfall on the
   *   legal shell, metres; null for a chain that is not hinged or is
   *   degenerate.
   */
  export function at(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limb: AutoMovieHumanLimb,
    goal: IAutoMovieHumanLimbGoal,
    swivel: number,
    branch: number,
  ): (IAutoMovieSeededChainFit & { shortfall: number }) | null {
    // The chain is posed on the records it reads (`HumanLimbView`), a left
    // limb's in their mirror image, and the posed records are merged back.
    const read: IRead = mirrored(body, pose, limb, goal);
    const posed: (IAutoMovieSeededChainFit & { shortfall: number }) | null =
      fitHingedChainAt(read.request, swivel, branch);
    return posed === null
      ? null
      : {
          ...posed,
          pose: HumanLimbView.merged(
            pose,
            read.view,
            read.image.joints,
            posed.pose.joints,
            null,
            read.left
              ? HumanLimbMirror.joint
              : (joint: IAutoMovieJointPose): IAutoMovieJointPose => joint,
          ),
        };
  }

  /**
   * The limb's joint angles at a swivel and branch before the range of motion
   * applies (`fitHingedChainAt.free`: Tolani, Goswami and Badler's theta_1 to
   * theta_7), with no placement: the request is `at`'s own. A left limb is read
   * as the right limb of its mirror image, so its angles are that right limb's,
   * read against the right bone's range (the ranges are mirror images).
   *
   * @param body The performer's body.
   * @param pose The pose before the limb is placed.
   * @param limb The limb.
   * @param goal Its goal, attached or not; its point is the end joint's target
   *   and its rotation, if any, the end joint's.
   * @param swivel The swivel, degrees, in the fit's seed frame (a left limb's
   *   in its mirror image).
   * @param branch The bend branch, 0 or 1.
   * @returns The angles, clinical degrees, in the fit's frame; null for a chain
   *   that is not hinged or is degenerate.
   */
  export function free(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limb: AutoMovieHumanLimb,
    goal: IAutoMovieHumanLimbGoal,
    swivel: number,
    branch: number,
  ): fitHingedChainAt.IFree | null {
    return fitHingedChainAt.free(
      mirrored(body, pose, limb, goal).request,
      swivel,
      branch,
    );
  }

  /**
   * The swivel and branch of a posed limb.
   *
   * @param body The performer's body.
   * @param pose The posed body.
   * @param limb The limb.
   * @returns Its seed in the fit's frame (a left limb's in its mirror image);
   *   null for a chain that is not hinged or is degenerate, or an end joint the
   *   rig lacks.
   */
  export function seed(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limb: AutoMovieHumanLimb,
  ): IAutoMovieSwivelSeed | null {
    // Read on the records the chain's frames depend on (`HumanLimbView`), a
    // left limb's in their mirror image; the whole pose is admitted first.
    HumanLimbView.admitted(body, pose);
    const view: HumanLimbView.IView = HumanLimbView.of(
      body,
      pose,
      limb,
      NOWHERE,
      [],
    );
    const left: boolean = limb.startsWith("left");
    const image: IAutoMoviePose = left
      ? HumanLimbMirror.pose(view.pose)
      : view.pose;
    const side: AutoMovieHumanLimb = left ? HumanLimbMirror.limb(limb) : limb;
    const chain: HumanLimbFit.IChain = HumanLimbFit.chain(side);
    const end: IAutoMovieResolvedBone | undefined = poseBones(
      body,
      image,
      undefined,
      new Set([chain.effector]),
    ).get(chain.effector);
    if (end === undefined) return null;
    const joint = (bone: AutoMovieHumanoidBone): IAutoMovieJointPose => {
      let found: IAutoMovieJointPose = {
        bone,
        flexion: 0,
        abduction: 0,
        twist: 0,
      };
      for (const j of image.joints) if (j.bone === bone) found = j;
      return found;
    };
    return readHingedChainSeed(
      request(body, image, side, {
        point: end.worldPosition,
        bend: end.worldPosition,
      }),
      joint(chain.upper),
      joint(chain.lower),
    );
  }
}

/**
 * A goal that rides no bone, for a reading that has none: only its absent
 * attachment is read.
 */
const NOWHERE: IAutoMovieHumanLimbGoal = {
  point: { x: 0, y: 0, z: 0 },
  bend: { x: 0, y: 0, z: 0 },
};

/**
 * A limb's request as the fit reads it: on the records the chain reads
 * (`HumanLimbView`), a left limb's in their mirror image, its goal carried into
 * the world; the whole pose admitted first.
 */
interface IRead {
  /** The records the chain reads. */
  view: HumanLimbView.IView;

  /** Whether the limb is a left one, read in its mirror image. */
  left: boolean;

  /** The records the chain is posed on, mirrored for a left limb. */
  image: IAutoMoviePose;

  /** The fit's request toward the carried goal. */
  request: IAutoMovieFitChainToTargetProps;
}

/** A limb's request as the fit reads it (`IRead`). */
function mirrored(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  limb: AutoMovieHumanLimb,
  goal: IAutoMovieHumanLimbGoal,
): IRead {
  const view: HumanLimbView.IView = HumanLimbView.of(
    body,
    pose,
    limb,
    goal,
    [],
  );
  const left: boolean = limb.startsWith("left");
  const image: IAutoMoviePose = left
    ? HumanLimbMirror.pose(view.pose)
    : view.pose;
  const chain: AutoMovieHumanLimb = left ? HumanLimbMirror.limb(limb) : limb;
  const carried: IAutoMovieHumanLimbGoal = HumanLimbFit.world(
    body,
    image,
    chain,
    left ? HumanLimbMirror.goal(goal) : goal,
  );
  HumanLimbView.admitted(body, pose);
  return { view, left, image, request: request(body, image, chain, carried) };
}

/** The fit's own request for a limb toward a world goal. */
function request(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  limb: AutoMovieHumanLimb,
  goal: Pick<IAutoMovieHumanLimbGoal, "point" | "bend" | "rotation">,
): IAutoMovieFitChainToTargetProps {
  return {
    skeleton: body.skeleton,
    pose,
    chain: HumanLimbFit.chain(limb),
    target: goal.point,
    bend: goal.bend,
    ...(goal.rotation === undefined ? {} : { effectorRotation: goal.rotation }),
    topology: body.topology,
    jointAxes: HUMANOID_JOINT_AXES,
    restFrames: HUMANOID_REST_FRAME,
  };
}
