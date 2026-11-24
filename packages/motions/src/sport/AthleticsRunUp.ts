import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { humanPostureHeading } from "../posture/humanPostureHeading";

/** The alternatives of `OfContext`'s site. */
type OfContext = "body" | "entry";

/**
 * Read the approach an event is entered from.
 *
 * @param context The event's context; its entry is read.
 * @param minimum The least approach speed the event takes, m/s.
 * @param axis The parameter that names the take-off foot, for refusals.
 * @param foot The authored take-off foot, when named.
 * @returns The approach, or `undefined` when the entry does not cut a run.
 * @throws {HumanRefusal} When the run is cut where the named foot, or exactly
 *   one foot, is not planted, or when the body moves slower than `minimum`.
 */
export function AthleticsRunUp(
  context: Pick<IAutoMovieMotionHumanActionContext, OfContext>,
  minimum: number,
  axis: string,
  foot: AutoMovieHumanSide | undefined,
): AthleticsRunUp.IApproach | undefined {
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
    toeOff: AthleticsRunUp.hips(context.body, from.plan.posture(end)),
  };
}

/**
 * The run-up a field event is entered from: a `run` cut at the footfall of the
 * take-off foot (`HumanChain.until`), its speed and heading read from the
 * displayed entry. Jumps, vaults and throws that start from an approach read it
 * here, so one rule decides what an admissible approach is.
 */
export namespace AthleticsRunUp {
  /** An approach as the event is entered from it. */
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

    /**
     * The hips joint where the run planned it at the end of that stance, world
     * metres.
     */
    toeOff: IAutoMovieVector3;
  }

  /**
   * The hips joint of a posture in the world: its rest offset from the root
   * turned by the posture's heading.
   *
   * @param body The body whose rest gives the offset.
   * @param posture The posture.
   * @returns World metres.
   */
  export function hips(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 {
    return Vector3.add(
      posture.root,
      Quaternion.rotateVector(
        humanPostureHeading(posture),
        body.rest.get("hips")!,
      ),
    );
  }

  /**
   * The take-off foot's placement over the rest of the run's stance, as the run
   * planned it.
   *
   * @param context The event's context, entered from a run.
   * @param foot The planted take-off foot.
   * @param seconds Seconds after the cut, within the stance the approach
   *   reports.
   * @returns The ankle point and foot rotation the run's leg goal holds then,
   *   or the entry's foot when the run sets no goal.
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
