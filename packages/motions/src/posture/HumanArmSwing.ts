import { bracketedBisection } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionHumanAudit } from "../audit/AutoMovieMotionHumanAudit";
import { AutoMovieMotionHumanAuditTangle } from "../audit/AutoMovieMotionHumanAuditTangle";
import { HumanArmClearance } from "./HumanArmClearance";
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

  /**
   * The precision of a swing's added abduction for a body, degrees, derived
   * from the motion audit's continuity limit.
   *
   * - The tolerance is the audit's jump (`AutoMovieMotionHumanAudit.LIMITS.jump`),
   *   5 mm, in metres: the largest displacement of a joint centre between
   *   two readings that the audit does not call a jump.
   * - The lever is the arm from the shoulder to the fingertips, the upper
   *   arm, forearm and hand (`IHumanBody.measure`), in metres: the farthest
   *   any point of the arm lies from the joint the abduction turns.
   * - A turn of the shoulder by an angle in radians moves a point at that
   *   lever along an arc of lever times angle, and its chord is no longer, so
   *   the precision is the jump over the lever, radians, times 180 / pi.
   *
   * An abduction found to it therefore moves no point of the arm by more than
   * the audit's jump, and two carriages that differ by it cannot read as one:
   * about 0.38 degrees on the average man, where the search from `SPAN` takes
   * seven halvings.
   *
   * @param body The body.
   * @returns Degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the tolerance and its owner, its unit, the lever and its source, the conversion and the resulting precision on one body.
   * @evidence contracts/development/implementation.md#principled-implementation A turn of the shoulder by an angle moves a point at a lever along an arc of the lever times the angle, which bounds its chord.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One quotient.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The length is the audit's own limit and the lever the body's own measure.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the audit's limit and the body's measure.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function precision(body: IAutoMovieMotionHumanBody): number {
    const lever: number =
      body.measure.upperArm + body.measure.forearm + body.measure.hand;
    return (AutoMovieMotionHumanAudit.LIMITS.jump / lever) * (180 / Math.PI);
  }

  /**
   * A posture whose arms, written by joint angles with no hand goal (a
   * gait's swing), are kept clear of the body: a swinging arm passing the
   * thigh is let out at the shoulder, so each named arm takes the least added
   * abduction, up to `SPAN`, at which each reading of its room is within that
   * reading in the quiet stance, found by bisection to the body's precision (`precision`); an arm that swings no
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
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture resolve per call, one room reading for an arm already clear and two more and a bisection to the body's precision for one that is not, about seven readings where a hundredth of a degree took twelve; the stance's room is solved once per body and arm.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanArmClearance.room` and `posed`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The stance rooms are kept per live body in a `WeakMap`.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    sides: readonly ("left" | "right")[],
  ): IAutoMovieMotionHumanPosture {
    let pose: IAutoMoviePose = resolveHumanPosture(body, posture);
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
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
      const arm: IAutoMovieMotionHumanArmClearance.IArm = {
        upper: read(`${side}UpperArm`),
        lower: read(`${side}LowerArm`),
        hand: read(`${side}Hand`),
      };

      // The least added abduction that keeps the arm's room within its
      // stance baseline, by bisection: the least moves continuously as the
      // swing does, where a local search could jump between frames.
      const baseline: IAutoMovieMotionHumanArmClearance.IBaseline = stance(
        body,
        side,
      );
      const out = (a: number): IAutoMovieMotionHumanArmClearance.IArm => ({
        ...arm,
        upper: [arm.upper[0], arm.upper[1] + a, arm.upper[2]],
      });
      const lacking = (a: number): number =>
        HumanArmClearance.room(body, pose, side, out(a), [], baseline);
      // The least added abduction that clears the arm, by the engine's
      // bisection to the body's precision: the room is not smooth (a forearm
      // leaves one shape as it meets another), so only whether a turn clears
      // is read, which bisection needs and an interpolating search would
      // misread.
      const short = (a: number): boolean => lacking(a) > TOLERANCE;
      const added: number = !short(0)
        ? 0
        : short(SPAN)
          ? SPAN
          : bracketedBisection(short, 0, SPAN, precision(body));
      const clear: IAutoMovieMotionHumanArmClearance.IArm = out(added);
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
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture, one resolve and one room reading per phase and arm, and a bisection's few more where an arm is not clear; once per take.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `of`'s bisection and the stance rooms.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing per call.
   */
  export function carriage(
    body: IAutoMovieMotionHumanBody,
    times: readonly number[],
    posture: (seconds: number) => IAutoMovieMotionHumanPosture,
    sides: readonly ("left" | "right")[],
  ): Record<"left" | "right", number> {
    const out: Record<"left" | "right", number> = { left: 0, right: 0 };
    for (const seconds of times) {
      const at: IAutoMovieMotionHumanPosture = posture(seconds);
      const cleared: IAutoMovieMotionHumanPosture = of(body, at, sides);
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
    posture: IAutoMovieMotionHumanPosture,
    carried: Readonly<Record<"left" | "right", number>>,
  ): IAutoMovieMotionHumanPosture {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
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
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
  ): IAutoMovieMotionHumanArmClearance.IBaseline {
    const known: Partial<
      Record<"left" | "right", IAutoMovieMotionHumanArmClearance.IBaseline>
    > = STANCE.get(body) ?? {};
    const have: IAutoMovieMotionHumanArmClearance.IBaseline | undefined =
      known[side];
    if (have !== undefined) return have;
    const pose: IAutoMoviePose = resolveHumanPosture(
      body,
      stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
    );
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
    );
    const value: IAutoMovieMotionHumanArmClearance.IBaseline = {
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
    IAutoMovieMotionHumanBody,
    Partial<
      Record<"left" | "right", IAutoMovieMotionHumanArmClearance.IBaseline>
    >
  > = new WeakMap();
}
