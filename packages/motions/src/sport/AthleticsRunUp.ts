import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The run-up a field event is entered from: a `run` cut at the footfall of
 * the take-off foot (`HumanChain.until`), its speed and heading read from
 * the displayed entry. Jumps, vaults and throws that start from an approach
 * read it here, so one rule decides what an admissible approach is.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, from which entry and which consumers share it.
 * @evidence contracts/development/design.md#principled-representation A side, a speed in m/s, a unit horizontal world heading and a world-metre ankle, all of the displayed entry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The approach record and its one reader; the events own what they do with it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is assumed about the run: an entry that is not a run returns no approach.
 */
export namespace AthleticsRunUp {
  /**
   * An approach as the event is entered from it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and frame.
   * @evidence contracts/development/design.md#principled-representation World metres and m/s on the horizontal plane; the heading has unit length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The take-off foot, the speed, the heading and the planted ankle the events read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record exists only for an admitted approach, so no member is optional.
   */
  export interface IApproach {
    /** The planted take-off foot. */
    foot: AutoMovieHumanSide;

    /** The body's horizontal speed at the entry, m/s. */
    speed: number;

    /** The horizontal direction of travel, a unit world vector. */
    heading: IAutoMovieVector3;

    /** The take-off foot's planted ankle, world metres. */
    ankle: IAutoMovieVector3;

    /** Seconds of the take-off foot's stance the run had left at the cut. */
    stance: number;

    /** The hips joint where the run planned it at the end of that stance, world metres. */
    toeOff: IAutoMovieVector3;
  }

  /**
   * Read the approach an event is entered from.
   *
   * @param context The event's context; its entry is read.
   * @param minimum The least approach speed the event takes, m/s.
   * @param axis The parameter that names the take-off foot, for refusals.
   * @param foot The authored take-off foot, when named.
   * @returns The approach, or `undefined` when the entry does not cut a run.
   * @throws {HumanRefusal} When the run is cut where the named foot, or exactly one foot, is not planted, or when the body moves slower than `minimum`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States inputs, the absent case and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The root's displayed linear velocity, projected on the floor, is the approach; the take-off foot is the one the run has planted at the cut, as a one-foot take-off needs (World Athletics TR27.1 for the high jump; the long jump, triple jump and vault plant one foot likewise).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Decide the run, the foot, then the speed.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A cut between footfalls or a slow run is refused with the planted feet or the speed it has, never re-timed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work on the entry record.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads only values the entry already holds.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh vectors and retains nothing.
   */
  export function of(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry">,
    minimum: number,
    axis: string,
    foot: AutoMovieHumanSide | undefined,
  ): IApproach | undefined {
    const entry: IAutoMovieMotionHumanActionContext["entry"] = context.entry;
    if (entry.from?.family !== "run") return undefined;
    const planted: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
      (side: AutoMovieHumanSide): boolean => entry.feet[side].planted,
    );
    const side: AutoMovieHumanSide | undefined =
      foot ?? (planted.length === 1 ? planted[0] : undefined);
    if (side === undefined || !planted.includes(side))
      throw new HumanRefusal({
        kind: "parameter",
        axis,
        value: foot ?? planted.join(" and "),
        feasible: { kind: "alternatives", values: planted },
        reason:
          foot === undefined
            ? `the run is cut with ${planted.length === 0 ? "no foot" : "both feet"} on the ground, so no take-off foot is planted`
            : `the run is cut while the ${foot} foot is in the air`,
        fix: "cut the run at the take-off foot's footfall (until its HeelStrike event)",
      });
    const flat: IAutoMovieVector3 = {
      x: entry.velocity.linear.x,
      y: 0,
      z: entry.velocity.linear.z,
    };
    const speed: number = Vector3.length(flat);
    if (!(speed >= minimum) || speed < 1e-9)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "approach",
        value: speed,
        feasible: { kind: "range", minimum, maximum: null, unit: "m/s" },
        reason: `the approach reaches the take-off at ${speed.toFixed(2)} m/s, below the ${minimum.toFixed(2)} m/s this event takes off from`,
        fix: "run faster or longer before the take-off",
      });
    // The rest of the run's own stance on that foot: its window's end and
    // the hips the run planned there, a reach the run's legs already met.
    const from: IAutoMovieMotionHumanEntryState.IFrom = entry.from;
    const window: IAutoMovieMotionHumanContactWindow | undefined =
      from.plan.contacts.find(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.part === `${side}Foot` &&
          c.from <= from.share + 1e-9 &&
          c.to >= from.share - 1e-9,
      );
    const end: number = (window?.to ?? from.share) * from.plan.duration;
    return {
      foot: side,
      speed,
      heading: Vector3.scale(flat, 1 / speed),
      ankle: { ...entry.feet[side].ankle },
      stance: end - from.share * from.plan.duration,
      toeOff: hips(context.body, from.plan.posture(end)),
    };
  }

  /**
   * The hips joint of a posture in the world: its rest offset from the root turned by the posture's heading.
   *
   * @param body The body whose rest gives the offset.
   * @param posture The posture.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the frame and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The root carries the hips' rest offset rotated by the yaw, pitch and roll the posture's heading composes (`resolveHumanPosture.heading`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation and one sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The joints below the hips do not move them, so no solve is needed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each posture is read once.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector.
   */
  export function hips(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 {
    return Vector3.add(
      posture.root,
      Quaternion.rotateVector(
        resolveHumanPosture.heading(posture),
        body.rest.get("hips")!,
      ),
    );
  }

  /**
   * The take-off foot's placement over the rest of the run's stance, as the run planned it.
   *
   * @param context The event's context, entered from a run.
   * @param foot The planted take-off foot.
   * @param seconds Seconds after the cut, within the stance the approach reports.
   * @returns The ankle point and foot rotation the run's leg goal holds then, or the entry's foot when the run sets no goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and its fallback.
   * @evidence contracts/development/implementation.md#principled-implementation The run's own leg goal at the same film second, so the stance's heel rise about the toes' joint and its reach are the run's, already met by its legs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One posture read of the interrupted plan.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the run's plan; nothing is restated.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture evaluation of the run per sample.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each second is read once by its caller.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh values.
   */
  export function stance(
    context: Pick<IAutoMovieMotionHumanActionContext, "entry">,
    foot: AutoMovieHumanSide,
    seconds: number,
  ): IAutoMovieMotionHumanFoot.IPlacement {
    const from: IAutoMovieMotionHumanEntryState.IFrom | undefined =
      context.entry.from;
    const goal: IAutoMovieHumanLimbGoal | undefined =
      from === undefined
        ? undefined
        : from.plan.posture(from.share * from.plan.duration + seconds).limbs[
            `${foot}Leg`
          ];
    return goal?.rotation === undefined
      ? {
          ankle: { ...context.entry.feet[foot].ankle },
          rotation: context.entry.feet[foot].rotation,
        }
      : { ankle: { ...goal.point }, rotation: goal.rotation };
  }
}