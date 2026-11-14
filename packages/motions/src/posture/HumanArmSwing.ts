import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionHumanAuditTangle } from "../audit/AutoMovieMotionHumanAuditTangle";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmClearance } from "./HumanArmClearance";
import type { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";
import { resolveHumanPosture } from "./resolveHumanPosture";

/**
 * A swinging arm kept clear of the body: an arm written by joint angles with
 * no hand goal, as a gait swings it, is let out at the shoulder where it
 * would pass through the thigh.
 *
 * `HumanArmClearance.swung` is this module's `of`; it lives apart because
 * the swing needs only one freedom, the upper arm's abduction, and its own
 * baseline, the room the arm has in the quiet stance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is cleared, by which freedom and against what.
 * @evidence contracts/development/design.md#principled-representation One function over a posture and the arms to clear, with the stance baseline kept per body.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The swing's clearance and its three bounds; `HumanArmClearance` owns the room readings and calls it as `swung`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An arm with a hand goal is the fit's to clear and is left alone.
 */
export namespace HumanArmSwing {
  /** The most abduction a swing is let out by, degrees (provisional: beyond it the arm is no longer the gait's). */
  export const SPAN: number = 40;

  /** The room over its baseline a clearing leaves, degrees (provisional: a twentieth of a degree, a quarter of a millimetre at the elbow). */
  export const TOLERANCE: number = 0.05;

  /** The phases of a stride at which a take's carriage is read, a stride being periodic in them (provisional: a twelfth of a stride, a few hundredths of a second). */
  export const PHASES: number = 12;

  /** The precision of a swing's added abduction, degrees: below the continuity audits' half degree, so frames cannot differ by it. */
  export const PRECISION: number = 0.01;

  /**
   * A posture whose arms, written by joint angles with no hand goal (a
   * gait's swing), are kept clear of the body: a swinging arm passing the
   * thigh is let out at the shoulder, so each named arm takes the least added
   * abduction, up to `SPAN`, at which each reading of its room is within that
   * reading in the quiet stance, found by bisection; an arm that swings no
   * deeper than it hangs is left as written.
   *
   * @param body The body.
   * @param posture The posture, the arms' joints set and their goals absent.
   * @param sides The arms to keep clear.
   * @returns The posture with the arms' upper arm joints let out.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which arms, against what allowance and what is written back.
   * @evidence contracts/development/implementation.md#principled-implementation A hanging arm's fingers lie against the thigh in the quiet stance, which the tangle audit takes as its baseline; the swing may come that near and no nearer, the same rule the audit reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolve, then one bisection per arm in the pose the arms before it were written into; the least abduction is continuous in time where the room is, so the swing has no jump a local search between frames would leave.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An arm with a hand goal is the fit's to clear and is left alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture resolve per call, one room reading for an arm already clear and about twelve for one that is not; the stance's room is solved once per body and arm.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanArmClearance.room` and `posed`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The stance rooms are kept per live body in a `WeakMap`.
   */
  export function of(
    body: IHumanBody,
    posture: IHumanPosture,
    sides: readonly ("left" | "right")[],
  ): IHumanPosture {
    let pose: IAutoMoviePose = resolveHumanPosture(body, posture);
    const joints: IHumanPosture["joints"] = { ...posture.joints };
    for (const side of sides) {
      if (posture.limbs[`${side}Arm`] !== undefined) continue;
      const read = (
        bone: AutoMovieHumanoidBone,
      ): readonly [number, number, number] => {
        const j: IAutoMovieJointPose | undefined = pose.joints.find(
          (q: IAutoMovieJointPose): boolean => q.bone === bone,
        );
        return [j?.flexion ?? 0, j?.abduction ?? 0, j?.twist ?? 0];
      };
      const arm: HumanArmClearance.IArm = {
        upper: read(`${side}UpperArm`),
        lower: read(`${side}LowerArm`),
        hand: read(`${side}Hand`),
      };

      // The least added abduction that keeps the arm's room within its
      // stance baseline, by bisection: the least moves continuously as the
      // swing does, where a local search could jump between frames.
      const baseline: HumanArmClearance.IBaseline = stance(body, side);
      const out = (a: number): HumanArmClearance.IArm => ({
        ...arm,
        upper: [arm.upper[0], arm.upper[1] + a, arm.upper[2]],
      });
      const lacking = (a: number): number =>
        HumanArmClearance.room(body, pose, side, out(a), [], baseline);
      let added: number = 0;
      if (lacking(0) > TOLERANCE) {
        let lo: number = 0;
        let hi: number = SPAN;
        if (lacking(hi) > TOLERANCE) lo = hi;
        else
          while (hi - lo > PRECISION) {
            const mid: number = (lo + hi) / 2;
            if (lacking(mid) > TOLERANCE) lo = mid;
            else hi = mid;
          }
        added = hi;
      }
      const clear: HumanArmClearance.IArm = out(added);
      joints[`${side}UpperArm`] = clear.upper;
      pose = HumanArmClearance.posed(pose, side, clear);
    }
    return { ...posture, joints };
  }

  /**
   * The carriage of a gait's swinging arms: for each named arm, the one
   * abduction a take adds to what the gait writes, the least that keeps the
   * arm clear (as `of` clears one posture) in every posture of the take,
   * read once at `PHASES` phases of one full stride and held through it. People
   * walk with the arms carried a little out from the body, the hands
   * passing the thighs (the shoulder ranges about 20 degrees in abduction
   * and adduction over a stride, Kang et al. 2023, Clinical Shoulder and
   * Elbow; a carriage of a few degrees over a gait's written abduction
   * stays inside it; provisional), and the
   * carriage of one take does not change from
   * step to step; a clearance searched afresh in every frame would follow
   * every hundredth of a degree of a fingertip grazing a thigh along the
   * swing, where abduction barely moves it off.
   *
   * @param body The body.
   * @param times The instants read: the phases of one of the take's full strides.
   * @param posture The take's posture before the carriage.
   * @param sides The arms carried.
   * @returns Degrees of abduction per arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read, over what, why it is held, and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation Each sample's least clearing abduction is `of`'s own; the carriage is the greatest of them, so every sample is clear by the same measure and the take's arms move only as the gait writes them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bisection per sample and arm that is not already clear, one maximum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An arm with a hand goal in a sample is the fit's and adds nothing.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture, one resolve and one room reading per phase and arm, and about twelve more where an arm is not clear; once per take.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `of`'s bisection and the stance rooms.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing per call.
   */
  export function carriage(
    body: IHumanBody,
    times: readonly number[],
    posture: (seconds: number) => IHumanPosture,
    sides: readonly ("left" | "right")[],
  ): Record<"left" | "right", number> {
    const out: Record<"left" | "right", number> = { left: 0, right: 0 };
    for (const seconds of times) {
      const at: IHumanPosture = posture(seconds);
      const cleared: IHumanPosture = of(body, at, sides);
      for (const side of sides)
        out[side] = Math.max(
          out[side],
          (cleared.joints[`${side}UpperArm`]?.[1] ?? 0) -
            (at.joints[`${side}UpperArm`]?.[1] ?? 0),
        );
    }
    return out;
  }

  /**
   * A posture with its arms carried: each named arm without a hand goal has
   * its upper arm's abduction raised by its carriage.
   *
   * @param posture The posture.
   * @param carried Degrees of abduction per arm (`carriage`).
   * @returns The posture with the arms carried.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is raised and which arms are left.
   * @evidence contracts/development/implementation.md#principled-implementation The carriage is an abduction added to the gait's own angles, so the swing it rides is unchanged.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One map over two arms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An arm with a hand goal is left alone.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function carry(
    posture: IHumanPosture,
    carried: Readonly<Record<"left" | "right", number>>,
  ): IHumanPosture {
    const joints: IHumanPosture["joints"] = { ...posture.joints };
    for (const side of ["left", "right"] as const) {
      const upper: readonly [number, number, number] | undefined =
        joints[`${side}UpperArm`];
      if (posture.limbs[`${side}Arm`] !== undefined || upper === undefined)
        continue;
      joints[`${side}UpperArm`] = [
        upper[0],
        upper[1] + carried[side],
        upper[2],
      ];
    }
    return { ...posture, joints };
  }

  /** Each reading of an arm's room in the body's quiet stance, degrees, solved once per body and arm. */
  function stance(
    body: IHumanBody,
    side: "left" | "right",
  ): HumanArmClearance.IBaseline {
    const known: Partial<
      Record<"left" | "right", HumanArmClearance.IBaseline>
    > = STANCE.get(body) ?? {};
    const have: HumanArmClearance.IBaseline | undefined = known[side];
    if (have !== undefined) return have;
    const pose: IAutoMoviePose = resolveHumanPosture(
      body,
      stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
    );
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
    );
    const value: HumanArmClearance.IBaseline = {
      forearm: HumanArmClearance.overshoot(
        body,
        HumanArmClearance.obstacles(body, bones, [
          side === "left" ? "right" : "left",
        ]),
        bones.get(`${side}LowerArm`)!.worldPosition,
        bones.get(`${side}Hand`)!.worldPosition,
        side,
        [],
        false,
      ),
      segments: AutoMovieMotionHumanAuditTangle.arm(body, bones, side),
    };
    STANCE.set(body, { ...known, [side]: value });
    return value;
  }

  /** The stance rooms already solved, per live body. */
  const STANCE: WeakMap<
    IHumanBody,
    Partial<Record<"left" | "right", HumanArmClearance.IBaseline>>
  > = new WeakMap();
}
