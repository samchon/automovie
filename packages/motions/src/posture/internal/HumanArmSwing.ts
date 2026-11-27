import { AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { AutoMovieMotionHumanAudit } from "../../audit/internal/AutoMovieMotionHumanAudit";
import { AutoMovieMotionHumanAuditTangle } from "../../audit/internal/AutoMovieMotionHumanAuditTangle";
import { HumanArmClearance } from "./HumanArmClearance";
import { HumanColliders } from "./HumanColliders";
import { poseBones } from "./poseBones";
import { prepareHumanArmRoom } from "./prepareHumanArmRoom";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import { prepareHumanSampledCourse } from "./prepareHumanSampledCourse";
import { resolveHumanPosture } from "./resolveHumanPosture";

/** Quiet-arm tolerances are invariant for the same prepared body geometry. */
const STANDING_ROOM: WeakMap<
  IAutoMovieMotionHumanBody,
  Partial<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmClearance.IBaseline>
  >
> = new WeakMap();

/**
 * The exact pose search, or a final-arm certificate in a stride-maximum
 * reduction.
 */
function cleared(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  sides: readonly AutoMovieHumanSide[],
  source?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: ReturnType<typeof prepareHumanPostureProjection>,
  resolved?: IAutoMoviePose,
  maxima?: Readonly<Record<AutoMovieHumanSide, number>>,
  entered?: HumanArmSwing.Entered,
  hinted?: HumanArmSwing.Angles,
): IAutoMovieMotionHumanPosture {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution(source);
  let pose: IAutoMoviePose =
    resolved ??
    resolveHumanPosture.seeded(
      body,
      posture,
      undefined,
      {},
      resolution,
      undefined,
      projection,
    ).pose;
  const joints: IAutoMovieMotionHumanPosture["joints"] = {
    ...posture.joints,
  };
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
    const side: AutoMovieHumanSide = sides[index]!;
    if (posture.limbs[`${side}Arm`] !== undefined) continue;
    const arm: IAutoMovieMotionHumanArmClearance.IArm = readArm(pose, side);
    // A later arm measures its room against the earlier arm's exact pose.
    // Only the last arm can discard a phase that cannot raise its running maximum.
    const maximum: number | undefined =
      index + 1 === sides.length ? maxima?.[side] : undefined;
    const original: number = posture.joints[`${side}UpperArm`]?.[1] ?? 0;
    const wins: (added: number) => boolean = (added: number): boolean =>
      maximum === undefined || arm.upper[1] + added - original > maximum;
    if (!wins(HumanArmSwing.SPAN)) continue;

    // The least added abduction that keeps the arm's room within its
    // stance baseline, by bisection: the least moves continuously as the
    // swing does, where a local search could jump between frames.
    const rooms: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmClearance.IBaseline>
    > = STANDING_ROOM.get(body) ?? {};
    const quietRoom: IAutoMovieMotionHumanArmClearance.IBaseline = (rooms[
      side
    ] ??= stance(body, side, standing));
    STANDING_ROOM.set(body, rooms);
    // An arm handed on lying deeper may stay as deep as it entered.
    const handed: IAutoMovieMotionHumanArmClearance.IBaseline | undefined =
      entered?.[side];
    const baseline: IAutoMovieMotionHumanArmClearance.IBaseline =
      handed === undefined
        ? quietRoom
        : {
            forearm: Math.max(quietRoom.forearm, handed.forearm),
            segments: Math.max(quietRoom.segments, handed.segments),
          };
    const out: (a: number) => IAutoMovieMotionHumanArmClearance.IArm = (
      a: number,
    ): IAutoMovieMotionHumanArmClearance.IArm => ({
      ...arm,
      upper: [arm.upper[0], arm.upper[1] + a, arm.upper[2]],
    });

    // Every candidate turns this arm alone, so the rest of the body is
    // posed and placed once for the search (`prepareHumanArmRoom`), which
    // reads each candidate's room as `HumanArmClearance.room` does.
    if (read === undefined) {
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, pose, resolution());
      read = { bones, placed: HumanColliders.placed(body, bones) };
    }
    const room: ReturnType<typeof prepareHumanArmRoom> = prepareHumanArmRoom(
      body,
      pose,
      side,
      [],
      baseline,
      resolution(),
      read,
      HumanArmSwing.TOLERANCE,
    );
    const lacking: (a: number) => number = (a: number): number => {
      const candidate: IAutoMovieMotionHumanArmClearance.IArm = out(a);
      return room(candidate, a === 0);
    };

    // The least added abduction that clears the arm, by the engine's
    // bisection to the body's precision: the room is not smooth (a forearm
    // leaves one shape as it meets another), so only whether a turn clears
    // is read, which bisection needs and an interpolating search would
    // misread.
    const short: (a: number) => boolean = (a: number): boolean =>
      lacking(a) > HumanArmSwing.TOLERANCE;
    const added: number = !short(0)
      ? 0
      : short(HumanArmSwing.SPAN)
        ? HumanArmSwing.SPAN
        : maximum === undefined || maximum === 0
          ? hintedAngle(short, hinted?.[side], HumanArmSwing.precision(body))
          : winningAngle(short, wins, HumanArmSwing.precision(body));
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

/** Verify the nearest prepared bracket in the live displayed pose. */
function hintedAngle(
  short: (degrees: number) => boolean,
  hint: number | undefined,
  precision: number,
): number {
  if (hint !== undefined && hint > 0) {
    const unit: number =
      HumanArmSwing.SPAN /
      2 ** Math.max(0, Math.ceil(Math.log2(HumanArmSwing.SPAN / precision)));
    const high: number = Math.min(
      HumanArmSwing.SPAN,
      Math.max(unit, Math.round(hint / unit) * unit),
    );
    if (!short(high) && short(high - unit)) return high;
  }
  return AutoMovieEngineMath.bracketedBisection(short, 0, HumanArmSwing.SPAN, precision);
}

/**
 * Follow the original finite-angle bisection until its certified clear upper
 * endpoint cannot increase the stride maximum. Every remaining candidate lies
 * below that endpoint, including for a nonmonotone room.
 */
function winningAngle(
  short: (angle: number) => boolean,
  wins: (angle: number) => boolean,
  precision: number,
): number {
  if (!(precision > 0))
    return AutoMovieEngineMath.bracketedBisection(short, 0, HumanArmSwing.SPAN, precision);
  let lo: number = 0;
  let hi: number = HumanArmSwing.SPAN;
  while (hi - lo > precision && wins(hi)) {
    const middle: number = (lo + hi) / 2;
    if (!(middle > lo && middle < hi)) break;
    if (short(middle)) lo = middle;
    else hi = middle;
  }
  return hi;
}

/** Each arm's room in the body's quiet stance, degrees. */
function stance(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  read: () => prepareHumanArmRoom.IRead,
): IAutoMovieMotionHumanArmClearance.IBaseline {
  const { bones, placed }: prepareHumanArmRoom.IRead = read();
  return {
    forearm: HumanArmClearance.overshoot(
      body,
      HumanArmClearance.obstacles(
        body,
        bones,
        [side === "left" ? "right" : "left"],
        placed,
      ),
      bones.get(`${side}LowerArm`)!.worldPosition,
      bones.get(`${side}Hand`)!.worldPosition,
      side,
      [],
      false,
    ),
    segments: AutoMovieMotionHumanAuditTangle.arm(body, bones, side, placed),
  };
}

/**
 * A posture whose arms, written by joint angles with no hand goal (a gait's
 * swing), are kept clear of the body: a swinging arm passing the thigh is let
 * out at the shoulder, so each named arm takes the least added abduction, up to
 * `SPAN`, at which each reading of its room is within that reading in the quiet
 * stance, found by bisection to the body's precision (`precision`); an arm that
 * swings no deeper than it hangs is left as written.
 *
 * @param body The body.
 * @param posture The posture, the arms' joints set and their goals absent.
 * @param sides The arms to keep clear.
 * @param source Optional exact FK source borrowed only from this synchronous
 *   same-body operation.
 * @param projection Optional genuine same-body ROM projector for the complete
 *   current pose and initial stance fit.
 * @param resolved The cold resolve of this very posture, when its caller
 *   already holds it (`resolveHumanPosture.seeded` or `fit` of its assembly);
 *   absent, the posture is resolved here.
 * @param entered Each arm's room as it entered the action, where it entered
 *   lying deeper than in the quiet stance (a hand left on a thigh by the action
 *   before); the stance's alone when absent.
 * @param hinted A prepared abduction bracket evaluated at the current second.
 * @returns The posture with the arms' upper arm joints let out.
 */
export function HumanArmSwing(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  sides: readonly AutoMovieHumanSide[],
  source?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: ReturnType<typeof prepareHumanPostureProjection>,
  resolved?: IAutoMoviePose,
  entered?: HumanArmSwing.Entered,
  hinted?: HumanArmSwing.Angles,
): IAutoMovieMotionHumanPosture {
  return cleared(
    body,
    posture,
    sides,
    source,
    projection,
    resolved,
    undefined,
    entered,
    hinted,
  );
}

/**
 * A swinging arm kept clear of the body: an arm written by joint angles with no
 * hand goal, as a gait swings it, is let out at the shoulder where it would
 * pass through the thigh.
 *
 * `HumanArmSwing.of` is this module's `of`; it lives apart because the swing
 * needs only one freedom, the upper arm's abduction, and its own baseline, the
 * room the arm has in the quiet stance.
 */
export namespace HumanArmSwing {
  /** Extra abduction in degrees, indexed by swinging side. */
  export type Angles = Readonly<Record<AutoMovieHumanSide, number>>;

  /**
   * Sample the expensive search over a fixed ground phase. Playback uses the
   * sampled curve as a bracket hint and verifies the current shape's actual
   * clearance before relying on it.
   */
  export function course(
    body: IAutoMovieMotionHumanBody,
    from: number,
    to: number,
    posture: (seconds: number) => IAutoMovieMotionHumanPosture,
    sides: readonly AutoMovieHumanSide[],
  ): (seconds: number) => Angles {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const project: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);
    const pick = (
      side: AutoMovieHumanSide,
      clear: IAutoMovieMotionHumanPosture,
      raw: IAutoMovieMotionHumanPosture,
    ): number =>
      (clear.joints[`${side}UpperArm`]?.[1] ?? 0) -
      (raw.joints[`${side}UpperArm`]?.[1] ?? 0);
    const read: (seconds: number) => number[] = prepareHumanSampledCourse({
      from,
      to,
      sample: (seconds: number): number[] => {
        const raw: IAutoMovieMotionHumanPosture = posture(seconds);
        const clear: IAutoMovieMotionHumanPosture = HumanArmSwing(
          body,
          raw,
          sides,
          resolution,
          project,
        );
        return [pick("left", clear, raw), pick("right", clear, raw)];
      },
      tolerance: { kind: "absolute", absolute: precision(body) },
      step: 1 / 30,
    });
    return (seconds: number): Angles => {
      const [left, right]: number[] = read(seconds);
      return { left: left!, right: right! };
    };
  }

  /**
   * The most abduction a swing is let out by, degrees (provisional: beyond it
   * the arm is no longer the gait's).
   */
  export const SPAN: number = 40;

  /**
   * The room over its baseline a clearing leaves, degrees (provisional: a
   * twentieth of a degree, a quarter of a millimetre at the elbow).
   */
  export const TOLERANCE: number = 0.05;

  /**
   * The phases of a stride at which a take's carriage is read, a stride being
   * periodic in them (provisional: a twelfth of a stride, a few hundredths of a
   * second).
   */
  export const PHASES: number = 12;

  /**
   * The precision of a swing's added abduction for a body, degrees, derived
   * from the motion audit's continuity limit.
   *
   * - The tolerance is the audit's jump
   *   (`AutoMovieMotionHumanAudit.LIMITS.jump`), 5 mm, in metres: the largest
   *   displacement of a joint centre between two readings that the audit does
   *   not call a jump.
   * - The lever is the arm from the shoulder to the fingertips, the upper arm,
   *   forearm and hand (`IHumanBody.measure`), in metres: the farthest any
   *   point of the arm lies from the joint the abduction turns.
   * - A turn of the shoulder by an angle in radians moves a point at that lever
   *   along an arc of lever times angle, and its chord is no longer, so the
   *   precision is the jump over the lever, radians, times 180 / pi.
   *
   * An abduction found to it therefore moves no point of the arm by more than
   * the audit's jump, and two carriages that differ by it cannot read as one:
   * about 0.38 degrees on the average man, where the search from `SPAN` takes
   * seven halvings.
   *
   * @param body The body.
   * @returns Degrees.
   */
  export function precision(body: IAutoMovieMotionHumanBody): number {
    const lever: number =
      body.measure.upperArm + body.measure.forearm + body.measure.hand;
    return (AutoMovieMotionHumanAudit.LIMITS.jump / lever) * (180 / Math.PI);
  }

  /** Each arm's room as it entered an action, by side (`of`'s `entered`). */
  export type Entered = Readonly<
    Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmClearance.IBaseline>
    >
  >;

  /**
   * The carriage of a gait's swinging arms: for each named arm, the one
   * abduction a take adds to what the gait writes, the least that keeps the arm
   * clear (as `of` clears one posture) in every posture of the take, read once
   * at `PHASES` phases of one full stride and held through it. People walk with
   * the arms carried a little out from the body, the hands passing the thighs
   * (the shoulder ranges about 20 degrees in abduction and adduction over a
   * stride, Kang et al. 2023, Clinical Shoulder and Elbow; a carriage of a few
   * degrees over a gait's written abduction stays inside it; provisional), and
   * the carriage of one take does not change from step to step; a clearance
   * searched afresh in every frame would follow every hundredth of a degree of
   * a fingertip grazing a thigh along the swing, where abduction barely moves
   * it off.
   *
   * @param body The body.
   * @param times The instants read: the phases of one of the take's full
   *   strides.
   * @param posture The take's complete posture before carriage, optionally
   *   borrowing the current FK3/ROM4 operation metadata.
   * @param sides The arms carried.
   * @param source Optional same-body synchronous FK source.
   * @param projection Optional genuine ROM projector borrowed only for this
   *   operation.
   * @returns Degrees of abduction per arm.
   */
  export function carriage(
    body: IAutoMovieMotionHumanBody,
    times: readonly number[],
    posture: IAutoMovieMotionHumanActionPlan["posture"],
    sides: readonly AutoMovieHumanSide[],
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): Record<AutoMovieHumanSide, number> {
    const out: Record<AutoMovieHumanSide, number> = { left: 0, right: 0 };
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(source);
    const project: ReturnType<typeof prepareHumanPostureProjection> =
      projection ?? prepareHumanPostureProjection(body);
    for (const seconds of times) {
      const at: IAutoMovieMotionHumanPosture = posture(
        seconds,
        undefined,
        resolution,
        project,
      );
      const phase: IAutoMovieMotionHumanPosture = cleared(
        body,
        at,
        sides,
        resolution,
        project,
        undefined,
        out,
      );
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
   * A posture with its arms carried: each named arm without a hand goal has its
   * upper arm's abduction raised by its carriage.
   *
   * @param posture The posture.
   * @param carried Degrees of abduction per arm (`carriage`).
   * @returns The posture with the arms carried.
   */
  export function carry(
    posture: IAutoMovieMotionHumanPosture,
    carried: Readonly<Record<AutoMovieHumanSide, number>>,
  ): IAutoMovieMotionHumanPosture {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    const sides: readonly AutoMovieHumanSide[] = ["left", "right"];
    for (const side of sides) {
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
}

/** Read the same first matching arm records, without three searches/callbacks. */
function readArm(
  pose: IAutoMoviePose,
  side: AutoMovieHumanSide,
): IAutoMovieMotionHumanArmClearance.IArm {
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
