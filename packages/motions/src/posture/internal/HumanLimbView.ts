import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
} from "@automovie/interface";

import { readHumanBone } from "../../body/internal/readHumanBone";
import { poseBones } from "./poseBones";

/*
 * The records a limb's fit reads of a pose: those of its chain, of the bone its
 * goal rides, of the bones whose colliders an arm keeps clear of and of a leg's
 * toes, with every ancestor of each.
 * Parameter body: The performer's body.
 * Parameter pose: The pose before the fit.
 * Parameter limb: The limb.
 * Parameter goal: Its goal, attached or not.
 * Parameter placed: The arms already placed, whose colliders an arm's fit reads.
 * Returns: The reduced pose and where its records lie in the whole one.
 */
export function HumanLimbView(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  limb: AutoMovieHumanLimb,
  goal: IAutoMovieHumanLimbGoal,
  placed: readonly AutoMovieHumanSide[],
): HumanLimbView.IView {
  const side: AutoMovieHumanSide = limb.startsWith("left") ? "left" : "right";
  const arm: boolean = limb.endsWith("Arm");

  // The bones whose frames or records the fit reads, closed under the
  // rig's parents: the obstacles of the other arm where it is placed and
  // the limb's own bones are the body's (`IHumanBody.reads`); a goal on a
  // bone adds it and the parents the body's set does not already hold,
  // climbed until one it holds.
  const others: boolean =
    arm && placed.some((other: AutoMovieHumanSide): boolean => other !== side);
  const kept: ReadonlySet<AutoMovieHumanoidBone> =
    body.reads[limb][others ? 1 : 0].bones;
  let read: ReadonlySet<AutoMovieHumanoidBone> = kept;
  if (goal.on !== undefined && !kept.has(goal.on)) {
    const grown: Set<AutoMovieHumanoidBone> = new Set(kept);
    for (
      let bone: AutoMovieHumanoidBone | null | undefined = goal.on;
      bone !== null && bone !== undefined && !grown.has(bone);
      bone = readHumanBone(body, bone)?.parent
    )
      grown.add(bone);
    read = grown;
  }
  const joints: IAutoMovieJointPose[] = [];
  const at: number[] = [];
  pose.joints.forEach((joint: IAutoMovieJointPose, index: number): void => {
    if (!read.has(joint.bone)) return;
    joints.push(joint);
    at.push(index);
  });
  return { pose: { ...pose, joints }, at };
}

/*
 * What one limb's fit reads of a pose, and the fit's result written back.
 *
 * A limb fit reads the frames of a few bones (its chain, the bone its goal
 * rides, the colliders an arm keeps clear of) and the records of its own chain.
 * A bone's frame depends on its own record and its ancestors' alone, so the
 * pose of just those records (`of`) places every bone the fit reads exactly
 * where the whole pose does, and the fit's mirror image, its root-position
 * frame, its forward kinematics and its joint scans then run over those few
 * records instead of every joint of the body. The whole pose's ordered
 * admission, which refuses a malformed record anywhere in it, is kept as its
 * own step (`admitted`). The solved records go back into the whole pose in the
 * place the fit gives them (`merged`).
 */
export namespace HumanLimbView {
  /*
   * The records one limb's fit reads.
   */
  export interface IView {
    /*
     * The pose with only the records the fit reads: the caller's root and other
     * members, and the caller's own joint records in their order.
     */
    pose: IAutoMoviePose;

    /*
     * The index of each of those records among the whole pose's joints, rising.
     */
    at: readonly number[];
  }

  /*
   * Whether a pose's whole ordered admission has run, shared by the fits of one
   * pose whose owner fits several limbs in turn: the first fit admits the pose,
   * and the others, whose poses differ from it only by the records earlier fits
   * solved, do not admit it again.
   */
  export interface IAdmission {
    /*
     * Whether the whole pose was admitted.
     */
    admitted: boolean;
  }

  /*
   * Admit a whole pose in order, once for the fits that share an admission.
   * Parameter body: The performer's body.
   * Parameter pose: The whole pose.
   * Parameter admission: The flag the pose's fits share; absent, the pose is
   * admitted now.
   * What forward kinematics throws for the first malformed
   * record or root.
   */
  export function admitted(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    admission?: IAdmission,
  ): void {
    if (admission?.admitted === true) return;
    poseBones(body, pose, undefined, NONE);
    if (admission !== undefined) admission.admitted = true;
  }

  /*
   * A fit's result written back into the whole pose.
   *
   * The fit returns its source's joints with the records it solved: the chain's
   * old records dropped and the solved ones appended, and the toes' record
   * replaced where it stood. The same is done to the whole pose: a record the
   * fit kept stays the caller's own object in its place, a dropped one leaves,
   * a replaced one is replaced in its place and the appended ones are appended,
   * so the whole pose's joints are in the order the fit would have given them
   * had it been run on every joint.
   * Parameter full: The whole pose before the fit.
   * Parameter view: Its reduced pose (`of`).
   * Parameter source: The joints the fit was run on: the reduced pose's own, or
   * their images record for record.
   * Parameter result: The joints the fit returned.
   * Parameter replaced: The bone whose records the fit replaces where they stand
   * rather than appending, in the fit's naming; null when it has none.
   * Parameter back: Takes a record the fit made back to the whole pose's naming.
   * Returns: The whole pose with the fit's records; `full` itself when the fit
   * returned its source's joints.
   */
  export function merged(
    full: IAutoMoviePose,
    view: IView,
    source: readonly IAutoMovieJointPose[],
    result: readonly IAutoMovieJointPose[],
    replaced: AutoMovieHumanoidBone | null,
    back: (joint: IAutoMovieJointPose) => IAutoMovieJointPose,
  ): IAutoMoviePose {
    if (result === source) return full;
    const given: Set<IAutoMovieJointPose> = new Set(source);
    const kept: Set<IAutoMovieJointPose> = new Set();
    const swapped: IAutoMovieJointPose[] = [];
    const appended: IAutoMovieJointPose[] = [];
    for (const joint of result)
      if (given.has(joint)) kept.add(joint);
      else if (joint.bone === replaced) swapped.push(joint);
      else appended.push(joint);

    // The whole pose's records in order: one outside the reduced pose stays,
    // one inside it stays, is replaced or leaves as the fit decided.
    const joints: IAutoMovieJointPose[] = [];
    let next: number = 0;
    let swap: number = 0;
    full.joints.forEach((joint: IAutoMovieJointPose, index: number): void => {
      if (view.at[next] !== index) {
        joints.push(joint);
        return;
      }
      const mine: IAutoMovieJointPose = source[next++]!;
      if (kept.has(mine)) joints.push(joint);
      else if (mine.bone === replaced && swap < swapped.length)
        joints.push(back(swapped[swap++]!));
    });
    for (const joint of appended) joints.push(back(joint));
    return { ...full, joints };
  }
}

/*
 * No bone demanded: forward kinematics then admits every record and composes no
 * frame.
 */
const NONE: ReadonlySet<AutoMovieHumanoidBone> = new Set();
