import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  type IAutoMovieSeededChainFit,
  type IAutoMovieSwivelSeed,
  type IFitChainToTargetProps,
  fitHingedChainAt,
  readHingedChainSeed,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMoviePose } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanLimbFit } from "./HumanLimbFit";
import { HumanLimbMirror } from "./HumanLimbMirror";
import { HumanLimbView } from "./HumanLimbView";
import type { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";

/**
 * A limb posed at a prescribed swivel and bend branch, and the swivel and
 * branch a posed limb has, in the frame its fits' seeds use: the closed-form
 * readings a caller choosing its own swivel (an arm course) needs, with no
 * search, score or continuation.
 *
 * A left limb is read as the right limb of its mirror image (`HumanLimbMirror`)
 * and mirrored back, as `HumanLimbFit.fit` solves it, so its swivel is the
 * one its fits' seeds carry. A goal attached to a bone is carried into the
 * world by the pose first (`HumanLimbFit.world`). The request is the fit's
 * own: the performer's skeleton, topology and the humanoid axis and rest
 * tables, the goal's point, bend and rotation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two readings, the mirror and attachment conventions and the request.
 * @evidence contracts/development/design.md#principled-representation World-metre goals, degree swivels and branch indices in the fit's seed frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two readings, read through HumanLimbFit.at and HumanLimbFit.seed by the arm course.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine's fitHingedChainAt and readHingedChainSeed and the fit's mirror and attachment owners.
 */
export namespace HumanLimbAt {
  /**
   * The limb posed at a swivel and branch.
   *
   * @param body The performer's body.
   * @param pose The pose before the limb is placed.
   * @param limb The limb.
   * @param goal Its goal, attached or not; its point is the end joint's target.
   * @param swivel The swivel, degrees, in the fit's seed frame (a left limb's in its mirror image).
   * @param branch The bend branch, 0 or 1.
   * @returns The pose with the limb placed, its seed and the shortfall on the legal shell, metres; null for a chain that is not hinged or is degenerate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the frame and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Mirrors a left limb, carries an attached goal into the world and evaluates fitHingedChainAt on the fit's own request.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reduce to the records read (`HumanLimbView.of`), mirror, carry, one engine call, merge the posed records back.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No search; the given swivel is kept. The whole pose is still admitted in order.
   * @evidence contracts/development/implementation.md#efficient-algorithms One chain preparation and one pose on the reduced records, plus the whole pose's admission and two walks of its joints.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call evaluates its own request.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function at(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
    swivel: number,
    branch: number,
  ): (IAutoMovieSeededChainFit & { shortfall: number }) | null {
    // The chain is posed on the records it reads (`HumanLimbView`), a left
    // limb's in their mirror image, and the posed records are merged back.
    const view: HumanLimbView.IView = HumanLimbView.of(body, pose, limb, goal, []);
    const left: boolean = limb.startsWith("left");
    const image: IAutoMoviePose = left ? HumanLimbMirror.pose(view.pose) : view.pose;
    const chain: IHumanPosture.Limb = left ? HumanLimbMirror.limb(limb) : limb;
    const carried: IHumanPosture.IGoal = HumanLimbFit.world(
      body, image, chain, left ? HumanLimbMirror.goal(goal) : goal);
    HumanLimbView.admitted(body, pose);
    const posed: (IAutoMovieSeededChainFit & { shortfall: number }) | null =
      fitHingedChainAt(request(body, image, chain, carried), swivel, branch);
    return posed === null ? null : {
      ...posed,
      pose: HumanLimbView.merged(pose, view, image.joints, posed.pose.joints, null,
        left ? HumanLimbMirror.joint : (joint: IAutoMovieJointPose): IAutoMovieJointPose => joint),
    };
  }

  /**
   * The swivel and branch of a posed limb.
   *
   * @param body The performer's body.
   * @param pose The posed body.
   * @param limb The limb.
   * @returns Its seed in the fit's frame (a left limb's in its mirror image); null for a chain that is not hinged or is degenerate, or an end joint the rig lacks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and the null cases.
   * @evidence contracts/development/implementation.md#principled-implementation Mirrors a left limb and reads readHingedChainSeed on the fit's request, its target the end joint's place in the pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the pose, reduce to the chain's records and their ancestors', mirror, one end-joint FK, one engine reading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unlisted joint reads as clinical zero, the rest pose's own value.
   * @evidence contracts/development/implementation.md#efficient-algorithms One requested FK and one engine reading.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads its own pose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function seed(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
  ): IAutoMovieSwivelSeed | null {
    // Read on the records the chain's frames depend on (`HumanLimbView`), a
    // left limb's in their mirror image; the whole pose is admitted first.
    HumanLimbView.admitted(body, pose);
    const view: HumanLimbView.IView = HumanLimbView.of(body, pose, limb, NOWHERE, []);
    const left: boolean = limb.startsWith("left");
    const image: IAutoMoviePose = left ? HumanLimbMirror.pose(view.pose) : view.pose;
    const side: IHumanPosture.Limb = left ? HumanLimbMirror.limb(limb) : limb;
    const chain: HumanLimbFit.IChain = HumanLimbFit.chain(side);
    const end: IAutoMovieResolvedBone | undefined =
      poseBones(body, image, undefined, new Set([chain.effector])).get(chain.effector);
    if (end === undefined) return null;
    const joint = (bone: AutoMovieHumanoidBone): IAutoMovieJointPose => {
      let found: IAutoMovieJointPose = { bone, flexion: 0, abduction: 0, twist: 0 };
      for (const j of image.joints) if (j.bone === bone) found = j;
      return found;
    };
    return readHingedChainSeed(
      request(body, image, side, { point: end.worldPosition, bend: end.worldPosition }),
      joint(chain.upper),
      joint(chain.lower),
    );
  }
}

/** A goal that rides no bone, for a reading that has none: only its absent attachment is read. */
const NOWHERE: IHumanPosture.IGoal = {
  point: { x: 0, y: 0, z: 0 },
  bend: { x: 0, y: 0, z: 0 },
};

/** The fit's own request for a limb toward a world goal. */
function request(
  body: IHumanBody,
  pose: IAutoMoviePose,
  limb: IHumanPosture.Limb,
  goal: Pick<IHumanPosture.IGoal, "point" | "bend" | "rotation">,
): IFitChainToTargetProps {
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
