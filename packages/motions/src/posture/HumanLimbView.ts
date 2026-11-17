import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmObstacleBones } from "./HumanArmObstacleBones";
import type { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";

/**
 * What one limb's fit reads of a pose, and the fit's result written back.
 *
 * A limb fit reads the frames of a few bones (its chain, the bone its goal
 * rides, the colliders an arm keeps clear of) and the records of its own
 * chain. A bone's frame depends on its own record and its ancestors' alone,
 * so the pose of just those records (`of`) places every bone the fit reads
 * exactly where the whole pose does, and the fit's mirror image, its
 * root-position frame, its forward kinematics and its joint scans then run
 * over those few records instead of every joint of the body. The whole
 * pose's ordered admission, which refuses a malformed record anywhere in
 * it, is kept as its own step (`admitted`). The solved records go back
 * into the whole pose in the place the fit gives them (`merged`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a fit reads, why the reduced pose places those bones identically, what admission keeps and where results go.
 * @evidence contracts/development/design.md#principled-representation A reduced pose is the caller's own records in their order with the place each has in the whole pose; an admission is one flag an owner of several fits of one pose shares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two records and three functions, read by `solveHumanLimbFit` and, for the flag, by the owners that fit several limbs of one pose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No frame, fit or result is kept; the reduced pose shares the caller's records and is solved by the unchanged fit.
 */
export namespace HumanLimbView {
  /**
   * The records one limb's fit reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its content and ownership.
   * @evidence contracts/development/design.md#principled-representation The pose with only the read records, the caller's own objects in their order, and each one's index among the whole pose's joints.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read by `merged` and the solve.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The indices rise, so the order is the whole pose's by construction.
   */
  export interface IView {
    /** The pose with only the records the fit reads: the caller's root and other members, and the caller's own joint records in their order. */
    pose: IAutoMoviePose;

    /** The index of each of those records among the whole pose's joints, rising. */
    at: readonly number[];
  }

  /**
   * Whether a pose's whole ordered admission has run, shared by the fits of
   * one pose whose owner fits several limbs in turn: the first fit admits
   * the pose, and the others, whose poses differ from it only by the
   * records earlier fits solved, do not admit it again.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the flag says, who shares it and why later fits need no second admission.
   * @evidence contracts/development/design.md#principled-representation One boolean owned by the operation that fits one pose's limbs in turn.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One member, written by `solveHumanLimbFit` and made by `refitHumanPosture` and `HumanLimbPair`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The premise that every pose passed with one flag differs only by solved limb records is its owner's; the flag does not check it.
   */
  export interface IAdmission {
    /** Whether the whole pose was admitted. */
    admitted: boolean;
  }

  /**
   * The records a limb's fit reads of a pose: those of its chain, of the
   * bone its goal rides, of the bones whose colliders an arm keeps clear of
   * and of a leg's toes, with every ancestor of each.
   *
   * @param body The performer's body.
   * @param pose The pose before the fit.
   * @param limb The limb.
   * @param goal Its goal, attached or not.
   * @param placed The arms already placed, whose colliders an arm's fit reads.
   * @returns The reduced pose and where its records lie in the whole one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which records are kept and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics composes a bone's frame from its parent's frame, its rest and its own record, so a bone's frame depends on the records of the bone and its ancestors alone; the kept set is closed under the rig's parent relation, so every bone the fit reads is placed as in the whole pose. The fit's contact step edits the toes' record in place, so a leg keeps it too.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The read bones, their closure under the parent relation, then one ordered selection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The read bones are the ones the fit itself demands (`HumanLimbFit`): its chain, its attachment, `HumanArmObstacleBones` and the toes. Duplicate records of a kept bone are all kept, in order.
   * @evidence contracts/development/implementation.md#efficient-algorithms The closure walks the rig's bones until no parent is added, twice for a rig listed parent first, and the selection walks the pose's joints once: O(B + J) set tests in place of the fit's several O(J) copies and scans.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each fit selects its own records.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns caller-owned records and retains nothing.
   */
  export function of(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
    placed: readonly ("left" | "right")[],
  ): IView {
    const side: "left" | "right" = limb.startsWith("left") ? "left" : "right";
    const arm: boolean = limb.endsWith("Arm");

    // The bones whose frames or records the fit reads.
    const read: Set<AutoMovieHumanoidBone> = new Set(
      arm
        ? HumanArmObstacleBones(
            placed.filter((other: "left" | "right"): boolean => other !== side),
          )
        : [],
    );
    for (const part of arm
      ? (["UpperArm", "LowerArm", "Hand"] as const)
      : (["UpperLeg", "LowerLeg", "Foot", "Toes"] as const))
      read.add(`${side}${part}`);
    if (goal.on !== undefined) read.add(goal.on);

    // Their ancestors: a pass adds each kept bone's parent, repeated until
    // none is added, so the order the rig lists its bones in does not matter.
    const bones: readonly IAutoMovieBone[] = body.skeleton.bones;
    for (let grown: boolean = true; grown; ) {
      grown = false;
      for (let i: number = bones.length - 1; i >= 0; --i) {
        const bone: IAutoMovieBone = bones[i]!;
        if (bone.parent === null || !read.has(bone.bone) || read.has(bone.parent))
          continue;
        read.add(bone.parent);
        grown = true;
      }
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

  /**
   * Admit a whole pose in order, once for the fits that share an admission.
   *
   * @param body The performer's body.
   * @param pose The whole pose.
   * @param admission The flag the pose's fits share; absent, the pose is admitted now.
   * @throws {Error} What forward kinematics throws for the first malformed record or root.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is admitted, when it is spared and what is thrown.
   * @evidence contracts/development/implementation.md#principled-implementation The body's forward kinematics with no bone demanded admits every record in order and composes no frame; a fit of the reduced pose would otherwise never read a malformed record outside it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One flag test and one read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The flag is set only after the admission returned, so a refused pose is refused again.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(J) admission per shared flag instead of one per fit; a fit with no flag pays it itself.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A later fit's pose differs from the admitted one only by records an earlier fit solved, which the fit's own forward kinematics admits when it reads them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Reads through a reader of its own that ends with the call.
   */
  export function admitted(
    body: IHumanBody,
    pose: IAutoMoviePose,
    admission?: IAdmission,
  ): void {
    if (admission?.admitted === true) return;
    poseBones(body, pose, undefined, NONE);
    if (admission !== undefined) admission.admitted = true;
  }

  /**
   * A fit's result written back into the whole pose.
   *
   * The fit returns its source's joints with the records it solved: the
   * chain's old records dropped and the solved ones appended, and the toes'
   * record replaced where it stood. The same is done to the whole pose: a
   * record the fit kept stays the caller's own object in its place, a
   * dropped one leaves, a replaced one is replaced in its place and the
   * appended ones are appended, so the whole pose's joints are in the order
   * the fit would have given them had it been run on every joint.
   *
   * @param full The whole pose before the fit.
   * @param view Its reduced pose (`of`).
   * @param source The joints the fit was run on: the reduced pose's own, or their images record for record.
   * @param result The joints the fit returned.
   * @param replaced The bone whose records the fit replaces where they stand rather than appending, in the fit's naming; null when it has none.
   * @param back Takes a record the fit made back to the whole pose's naming.
   * @returns The whole pose with the fit's records; `full` itself when the fit returned its source's joints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fit's three kinds of edit, how each is replayed and the unchanged case.
   * @evidence contracts/development/implementation.md#principled-implementation The fit's edits are order-preserving filters, appends and one in-place replacement of its source's joints; an order-preserving selection commutes with them, so replaying them on the whole pose by each record's index gives the filters' and appends' result on the whole pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The kept set, the replaced and appended records, then one walk of the whole pose.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A kept record is recognised by identity, never by its bone or its values; the one in-place replacement is the named bone's, matched in order.
   * @evidence contracts/development/implementation.md#efficient-algorithms One walk of the whole pose's joints and two set builds over the reduced ones.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each result is merged once.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a caller-owned pose sharing the unchanged records.
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

/** No bone demanded: forward kinematics then admits every record and composes no frame. */
const NONE: ReadonlySet<AutoMovieHumanoidBone> = new Set();
