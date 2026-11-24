import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanArmSwing } from "../posture/HumanArmSwing";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A planned carry whose rest ends are the arm hanging where its span leaves and
 * regains it: its rest let out by `HumanArmSwing.of` on the posture so far at
 * the span's start, and, where the span returns and names no arm of its own to
 * return to, at the span's end. Off the plan the carry writes that same hanging
 * arm, so the plan starts and ends on the arm shown.
 *
 * @param member The carry.
 * @param span Its span.
 * @param before The posture so far, the planned arms left out.
 * @returns The carry, itself where neither end is let out.
 */
export function AutoMovieMotionHumanArmCarryHung(
  member: IAutoMovieMotionHumanArmCarry.ICarry,
  span: IAutoMovieMotionHumanArmPlanned.ISpan,
  before: (seconds: number) => IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanArmCarry.ICarry {
  const handed: HumanArmSwing.Entered = AutoMovieMotionHumanArmCarryHung.entering(
    member,
    before(member.from),
  );
  const rest: IAutoMovieMotionHumanArmAngles.IAngles = hanging(
    member,
    before(span.start),
    handed,
  );
  const back: IAutoMovieMotionHumanArmAngles.IAngles | undefined =
    member.back !== undefined || !(span.relax < span.end)
      ? member.back
      : hanging(member, before(span.end), handed);
  if (rest === member.rest && (back === undefined || back === member.rest))
    return member;
  return {
    ...member,
    rest,
    ...(back === undefined ? {} : { back }),
  };
}

/** A carry's arm's room as it enters its action. */
export namespace AutoMovieMotionHumanArmCarryHung {
  /**
   * A carry's arm's room as it enters its action: its rest in the posture of the
   * action's first second, read as the hanging-arm owner reads a room
   * (`HumanArmClearance.baseline`). An arm the action before left lying on a
   * thigh enters deeper than it hangs in the quiet stance; the carry starts on
   * that arm, so its let-out reads that depth as the arm's own.
   *
   * @param member The carry.
   * @param posture The posture of the action's first second.
   * @returns The room, by the carry's side.
   */
  export function entering(
    member: IAutoMovieMotionHumanArmCarry.ICarry,
    posture: IAutoMovieMotionHumanPosture,
  ): HumanArmSwing.Entered {
    const out: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmClearance.IBaseline>
    > = {};
    out[member.side] = HumanArmClearance.baseline(
      member.body,
      resolveHumanPosture.seeded(member.body, rested(member, posture)).pose,
      member.side,
      member.rest,
    );
    return out;
  }
}

/**
 * A carry's rest arm hanging in a posture: its upper arm let out by the least
 * abduction that keeps it clear (`HumanArmSwing.of`).
 *
 * @param member The carry.
 * @param posture The posture the arm hangs in.
 * @param handed The arm's room as it entered the action (`entering`).
 * @returns The rest angles, the same record where nothing is let out.
 */
function hanging(
  member: IAutoMovieMotionHumanArmCarry.ICarry,
  posture: IAutoMovieMotionHumanPosture,
  handed: HumanArmSwing.Entered,
): IAutoMovieMotionHumanArmAngles.IAngles {
  const side: AutoMovieHumanSide = member.side;
  const upper: readonly [number, number, number] | undefined = HumanArmSwing(
    member.body,
    rested(member, posture),
    [side],
    undefined,
    undefined,
    undefined,
    handed,
  ).joints[`${side}UpperArm`];
  return upper === undefined || upper[1] === member.rest.upper[1]
    ? member.rest
    : { ...member.rest, upper };
}

/**
 * A posture with a carry's rest written on its arm and the arm's goal removed:
 * the arm as the carry holds it at weight 0.
 *
 * @param member The carry.
 * @param posture The posture.
 * @returns The posture with the rest arm.
 */
function rested(
  member: IAutoMovieMotionHumanArmCarry.ICarry,
  posture: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanPosture {
  const side: AutoMovieHumanSide = member.side;
  const joints: IAutoMovieMotionHumanPosture["joints"] = { ...posture.joints };
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
  joints[`${side}UpperArm`] = member.rest.upper;
  joints[`${side}LowerArm`] = member.rest.lower;
  joints[`${side}Hand`] = member.rest.hand;
  delete limbs[`${side}Arm`];
  return { ...posture, joints, limbs };
}
