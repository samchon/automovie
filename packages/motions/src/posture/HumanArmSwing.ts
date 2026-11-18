import { bracketedBisection } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanActionPlan,
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
import { HumanColliders } from "./HumanColliders";
import { poseBones } from "./poseBones";
import { prepareHumanArmRoom } from "./prepareHumanArmRoom";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
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
   * @param source Optional exact FK source borrowed only from this synchronous same-body operation.
   * @param projection Optional genuine same-body ROM projector for the complete current pose and initial stance fit.
   * @param resolved The cold resolve of this very posture, when its caller already holds it (`resolveHumanPosture.seeded` or `fit` of its assembly); absent, the posture is resolved here.
   * @returns The posture with the arms' upper arm joints let out.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which arms, against what allowance and what is written back.
   * @evidence contracts/development/implementation.md#principled-implementation A hanging arm's fingers lie against the thigh in the quiet stance, which the tangle audit takes as its baseline; the swing may come that near and no nearer, the same rule the audit reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolve and one ordered current-joint scan per free arm precede its bisection in the pose earlier arms produced; the same continuous room crossing determines least abduction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An arm with a hand goal is the fit's to clear and is left alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms Keeps all current arm fits, clearance and bisection readings and fresh outputs. In a call that needs both quiet-stance allowances, both read the same stance fit and collider placement. When all needed allowances already exist, it prepares no quiet stance.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Complete seeded pose and stance fits may borrow one same-operation FK workspace and genuine ROM projector. Each candidate remains fully admitted. A quiet-stance allowance reads the bones and shapes of the same unchanged modeled stance on either side.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The existing weak stance map retains two scalars per body/arm only. Local/parent FK and ROM loans end with the synchronous operation; neither returned posture nor stance cache stores a reader, projector, current pose or callback.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    sides: readonly ("left" | "right")[],
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
    resolved?: IAutoMoviePose,
  ): IAutoMovieMotionHumanPosture {
    return cleared(body, posture, sides, source, projection, resolved);
  }

  /** The exact pose search, or a final-arm certificate in a stride-maximum reduction. */
  function cleared(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    sides: readonly ("left" | "right")[],
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
    resolved?: IAutoMoviePose,
    maxima?: Readonly<Record<"left" | "right", number>>,
  ): IAutoMovieMotionHumanPosture {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
    let pose: IAutoMoviePose = resolved ??
      resolveHumanPosture.seeded(body, posture, undefined, {}, resolution, undefined, projection).pose;
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...posture.joints };
    // The pose's bones and placed segments, read once and shared by the
    // next arm's search where the arm before it was written back as it was.
    let read: prepareHumanArmRoom.IRead | undefined;
    let quiet: prepareHumanArmRoom.IRead | undefined;
    const standing = (): prepareHumanArmRoom.IRead => {
      if (quiet !== undefined) return quiet;
      const base: IAutoMoviePose = resolveHumanPosture.seeded(
        body,
        stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
        undefined,
        {},
        resolution,
        undefined,
        projection,
      ).pose;
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
        body,
        base,
        resolution(),
      );
      quiet = { bones, placed: HumanColliders.placed(body, bones) };
      return quiet;
    };
    for (let index: number = 0; index < sides.length; index++) {
      const side: "left" | "right" = sides[index]!;
      if (posture.limbs[`${side}Arm`] !== undefined) continue;
      const arm: IAutoMovieMotionHumanArmClearance.IArm = readArm(pose, side);
      // A later arm measures its room against the earlier arm's exact pose.
      // Only the last arm can discard a phase that cannot raise its running maximum.
      const maximum: number | undefined = index + 1 === sides.length ? maxima?.[side] : undefined;
      const original: number = posture.joints[`${side}UpperArm`]?.[1] ?? 0;
      const wins: (added: number) => boolean = (added: number): boolean =>
        maximum === undefined || arm.upper[1] + added - original > maximum;
      if (!wins(SPAN)) continue;

      // The least added abduction that keeps the arm's room within its
      // stance baseline, by bisection: the least moves continuously as the
      // swing does, where a local search could jump between frames.
      const baseline: IAutoMovieMotionHumanArmClearance.IBaseline = stance(
        body,
        side,
        standing,
      );
      const out: (a: number) => IAutoMovieMotionHumanArmClearance.IArm = (a: number): IAutoMovieMotionHumanArmClearance.IArm => ({
        ...arm,
        upper: [arm.upper[0], arm.upper[1] + a, arm.upper[2]],
      });

      // Every candidate turns this arm alone, so the rest of the body is
      // posed and placed once for the search (`prepareHumanArmRoom`), which
      // reads each candidate's room as `HumanArmClearance.room` does.
      if (read === undefined) {
        const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, pose, resolution());
        read = { bones, placed: HumanColliders.placed(body, bones) };
      }
      const room: ReturnType<typeof prepareHumanArmRoom> =
        prepareHumanArmRoom(body, pose, side, [], baseline, resolution(), read, TOLERANCE);
      const lacking: (a: number) => number = (a: number): number => {
        const candidate: IAutoMovieMotionHumanArmClearance.IArm = out(a);
        return room(candidate, a === 0);
      };

      // The least added abduction that clears the arm, by the engine's
      // bisection to the body's precision: the room is not smooth (a forearm
      // leaves one shape as it meets another), so only whether a turn clears
      // is read, which bisection needs and an interpolating search would
      // misread.
      const short: (a: number) => boolean = (a: number): boolean => lacking(a) > TOLERANCE;
      const added: number = !short(0)
        ? 0
        : short(SPAN)
          ? SPAN
          : maximum === undefined || maximum === 0
            ? bracketedBisection(short, 0, SPAN, precision(body))
            : winningAngle(short, wins, precision(body));
      const clear: IAutoMovieMotionHumanArmClearance.IArm = out(added);
      joints[`${side}UpperArm`] = clear.upper;
      // Written back with every record of the arm's three joints as it was,
      // the pose's bones and segments are the ones read; otherwise the next
      // arm reads its own.
      if (index + 1 < sides.length) {
        if (!prepareHumanArmRoom.matches(pose, side, clear)) read = undefined;
        pose = HumanArmClearance.posed(pose, side, clear);
      }
    }
    return { ...posture, joints };
  }

  /** Follow the original finite-angle bisection until its certified clear
   * upper endpoint cannot increase the stride maximum. Every remaining
   * candidate lies below that endpoint, including for a nonmonotone room.
   */
  function winningAngle(
    short: (angle: number) => boolean,
    wins: (angle: number) => boolean,
    precision: number,
  ): number {
    if (!(precision > 0) || !Number.isFinite(precision))
      return bracketedBisection(short, 0, SPAN, precision);
    let lo: number = 0;
    let hi: number = SPAN;
    while (hi - lo > precision && wins(hi)) {
      const middle: number = (lo + hi) / 2;
      if (!(middle > lo && middle < hi)) break;
      if (short(middle)) lo = middle;
      else hi = middle;
    }
    return hi;
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
   * @param posture The take's complete posture before carriage, optionally borrowing the current FK3/ROM4 operation metadata.
   * @param sides The arms carried.
   * @param source Optional same-body synchronous FK source.
   * @param projection Optional genuine ROM projector borrowed only for this operation.
   * @returns Degrees of abduction per arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read, over what, why it is held, and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation Each sample's least clearing abduction is `of`'s own; the carriage is the greatest of them, so every sample is clear by the same measure and the take's arms move only as the gait writes them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Accumulate the maximum while preserving earlier-arm geometry. A last-arm search may end at its first certified upper bound below that maximum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An arm with a hand goal in a sample is the fit's and adds nothing.
   * @evidence contracts/development/implementation.md#efficient-algorithms Evaluate every requested posture, then only native room candidates that can change its maximum or affect another arm. An already dominated bisection omits the rest of its candidate evaluations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every actual phase callback and of call receives one operation-local/borrowed FK source and genuine ROM projector. The native full fits and room/bisection observations still run; only fixed ROM indexing and exact checked FK work are shared across phases.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous carriage owns its getter and at most one genuine projector, first demanded after an actual posture callback, until return/throw. Only two numeric abductions escape; no current posture, workspace or callback is retained.
   */
  export function carriage(
    body: IAutoMovieMotionHumanBody,
    times: readonly number[],
    posture: IAutoMovieMotionHumanActionPlan["posture"],
    sides: readonly ("left" | "right")[],
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): Record<"left" | "right", number> {
    const out: Record<"left" | "right", number> = { left: 0, right: 0 };
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
    let project: ReturnType<typeof prepareHumanPostureProjection> | undefined = projection;
    for (const seconds of times) {
      const at: IAutoMovieMotionHumanPosture = posture(seconds, undefined, resolution, project);
      if (project === undefined) project = prepareHumanPostureProjection(body);
      const phase: IAutoMovieMotionHumanPosture = cleared(body, at, sides, resolution, project, undefined, out);
      for (const side of sides)
        out[side] = Math.max(
          out[side],
          (phase.joints[`${side}UpperArm`]?.[1] ?? 0) -
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
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...posture.joints };
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

  /** Each arm's room in the body's quiet stance, degrees. */
  function stance(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    read: () => prepareHumanArmRoom.IRead,
  ): IAutoMovieMotionHumanArmClearance.IBaseline {
    const known: Partial<
      Record<"left" | "right", IAutoMovieMotionHumanArmClearance.IBaseline>
    > = STANCE.get(body) ?? {};
    const have: IAutoMovieMotionHumanArmClearance.IBaseline | undefined = known[side];
    if (have !== undefined) return have;
    const { bones, placed }: prepareHumanArmRoom.IRead = read();
    const value: IAutoMovieMotionHumanArmClearance.IBaseline = {
      forearm: HumanArmClearance.overshoot(
        body,
        HumanArmClearance.obstacles(body, bones, [
          side === "left" ? "right" : "left",
        ], placed),
        bones.get(`${side}LowerArm`)!.worldPosition,
        bones.get(`${side}Hand`)!.worldPosition,
        side,
        [],
        false,
      ),
      segments: AutoMovieMotionHumanAuditTangle.arm(body, bones, side, placed),
    };
    STANCE.set(body, { ...known, [side]: value });
    return value;
  }

  /** The stance rooms already solved, per live body. */
  const STANCE: WeakMap<
    IAutoMovieMotionHumanBody,
    Partial<Record<"left" | "right", IAutoMovieMotionHumanArmClearance.IBaseline>>
  > = new WeakMap();
}

/** Read the same first matching arm records, without three searches/callbacks. */
function readArm(pose: IAutoMoviePose, side: "left" | "right"): IAutoMovieMotionHumanArmClearance.IArm {
  const upperName: AutoMovieHumanoidBone = `${side}UpperArm`;
  const lowerName: AutoMovieHumanoidBone = `${side}LowerArm`;
  const handName: AutoMovieHumanoidBone = `${side}Hand`;
  let upper: IAutoMovieJointPose | undefined;
  let lower: IAutoMovieJointPose | undefined;
  let hand: IAutoMovieJointPose | undefined;
  for (const joint of pose.joints) {
    const bone: AutoMovieHumanoidBone = joint.bone;
    if (bone === upperName && upper === undefined) upper = joint;
    if (bone === lowerName && lower === undefined) lower = joint;
    if (bone === handName && hand === undefined) hand = joint;
    if (upper !== undefined && lower !== undefined && hand !== undefined) break;
  }
  return {
    upper: [upper?.flexion ?? 0, upper?.abduction ?? 0, upper?.twist ?? 0],
    lower: [lower?.flexion ?? 0, lower?.abduction ?? 0, lower?.twist ?? 0],
    hand: [hand?.flexion ?? 0, hand?.abduction ?? 0, hand?.twist ?? 0],
  };
}
