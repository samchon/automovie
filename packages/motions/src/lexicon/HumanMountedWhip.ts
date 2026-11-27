import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { hipJoints } from "../posture/internal/hipJoints";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import type { HumanMountedTimeline } from "./HumanMountedTimeline";

/** One instant of a performance cue track. */
type Cue = ReturnType<IAutoMovieMotionHumanActionContext["cue"]>[number];

/**
 * A mounted performance's whip strokes (`IAutoMovieMotionHumanMounted.IWhip`):
 * the striking hand leaves its rein `REACH` seconds before each cue instant,
 * strikes behind the rider's thigh on its side at the instant, and takes the
 * rein again `REACH` seconds after, a jockey's stroke in rhythm with the stride
 * the author's cue track marks.
 */
export namespace HumanMountedWhip {
  /**
   * Seconds the striking hand takes from its rein to the stroke's contact and
   * back again (provisional).
   */
  export const REACH: number = 0.25;

  /**
   * Where the stroke lands from the striking side's hip joint, thigh lengths:
   * out to the side, a little down and behind, beside the horse's quarters
   * (provisional).
   */
  export const TARGET: Readonly<IAutoMovieVector3> = {
    x: 0.6,
    y: -0.2,
    z: -0.8,
  };

  /** One stroke. */
  export interface IStroke {
    /** The striking hand. */
    side: AutoMovieHumanSide;

    /** The stroke's contact, local seconds. */
    at: number;
  }

  /**
   * Every figure's strokes, read from its cue track inside its hold.
   *
   * @param cue The performance's cue reader.
   * @param start The performance's start, film seconds.
   * @param figures The figures.
   * @param clock The performance's clock.
   * @returns The strokes in time order.
   * @throws {HumanRefusal} When a figure's striking hand holds no rein, a
   *   stroke's reach leaves the figure's hold, or two strokes overlap.
   */
  export function strokes(
    cue: IAutoMovieMotionHumanActionContext["cue"],
    start: number,
    figures: readonly IAutoMovieMotionHumanMounted.IFigure[],
    clock: HumanMountedTimeline,
  ): IStroke[] {
    const out: IStroke[] = [];
    figures.forEach(
      (figure: IAutoMovieMotionHumanMounted.IFigure, i: number): void => {
        const whip: IAutoMovieMotionHumanMounted.IWhip | undefined =
          figure.whip;
        if (whip === undefined) return;
        const axis: string = `figures.${i}.whip`;
        if (figure.supports?.[`${whip.hand}Hand`] === undefined)
          refuse(
            axis,
            whip,
            `the ${whip.hand} hand strikes from a rein, and figure ${i} holds none`,
          );
        const from: number = clock.arrivals[i]!;
        const to: number = from + figure.hold;
        const instants: number[] = cue(whip.cue)
          .map((c: Cue): number => c.seconds - start)
          .filter((t: number): boolean => t >= from && t <= to)
          .sort((a: number, b: number): number => a - b);
        for (const at of instants) {
          const last: IStroke | undefined = out[out.length - 1];
          if (at - REACH < from || at + REACH > to)
            refuse(
              axis,
              at,
              `a stroke at ${at.toFixed(3)} s does not fit its reach inside figure ${i}'s hold`,
            );
          if (last !== undefined && last.at + 2 * REACH > at)
            refuse(
              axis,
              at,
              `the stroke at ${at.toFixed(3)} s overlaps the one before`,
            );
          out.push({ side: whip.hand, at });
        }
      },
    );
    return out;
  }

  /**
   * How far a hand is into a stroke at a second: 0 on its rein, 1 at the
   * contact, eased by minimum jerk both ways.
   *
   * @param strokes The strokes.
   * @param side The hand.
   * @param at Local seconds.
   * @returns The weight.
   */
  export function weight(
    strokes: readonly IStroke[],
    side: AutoMovieHumanSide,
    at: number,
  ): number {
    for (const stroke of strokes)
      if (stroke.side === side && Math.abs(at - stroke.at) < REACH)
        return AutoMovieEngineMotionSampling.minimumJerkShare(1 - Math.abs(at - stroke.at) / REACH);
    return 0;
  }

  /**
   * The grip windows with each stroke's reach cut out of its hand's rein
   * window: the hand lets go of the rein when it leaves for the stroke and
   * takes it again when it returns.
   *
   * @param windows The performance's contact windows.
   * @param strokes The strokes.
   * @param duration The performance's duration, seconds.
   * @returns The windows, the striking hands' rein windows split around their
   *   strokes.
   */
  export function split(
    windows: readonly IAutoMovieMotionHumanContactWindow[],
    strokes: readonly IStroke[],
    duration: number,
  ): IAutoMovieMotionHumanContactWindow[] {
    let out: IAutoMovieMotionHumanContactWindow[] = [...windows];
    for (const stroke of strokes) {
      const leave: number = (stroke.at - REACH) / duration;
      const back: number = (stroke.at + REACH) / duration;
      out = out.flatMap(
        (
          window: IAutoMovieMotionHumanContactWindow,
        ): IAutoMovieMotionHumanContactWindow[] =>
          window.part === `${stroke.side}Hand` &&
          window.kind === "grip" &&
          window.from <= leave &&
          window.to >= back
            ? [
                { ...window, to: leave },
                { ...window, from: back },
              ]
            : [window],
      );
    }
    return out;
  }

  /**
   * Move each striking arm toward its stroke's target by the stroke's weight,
   * leaving its rein for the stroke and returning to it; an arm with no goal is
   * left alone.
   *
   * @param body The body.
   * @param posture The displayed posture, for the hips the target is read from.
   * @param limbs The limb goals to amend, the holding arms included.
   * @param strokes The strokes.
   * @param at Local seconds.
   */
  export function strike(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    limbs: IAutoMovieMotionHumanPosture["limbs"],
    strokes: readonly IStroke[],
    at: number,
  ): void {
    for (const side of ["left", "right"] as const) {
      const struck: number = weight(strokes, side, at);
      const arm: IAutoMovieMotionHumanPosture["limbs"]["leftArm"] =
        limbs[`${side}Arm`];
      if (struck > 0 && arm !== undefined)
        limbs[`${side}Arm`] = {
          ...arm,
          point: Vector3.lerp(arm.point, target(body, posture, side), struck),
          planted: false,
        };
    }
  }

  /**
   * Where a stroke lands for a posture: `TARGET` thighs from the striking
   * side's hip joint, turned with the pelvis.
   *
   * @param body The body.
   * @param posture The posture.
   * @param side The striking hand.
   * @returns The point, in the posture's frame.
   */
  export function target(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
  ): IAutoMovieVector3 {
    const turn: IAutoMovieQuaternion = humanPostureHeading(posture);
    const hip: IAutoMovieVector3 = hipJoints(
      body,
      posture.root,
      turn,
      posture.joints.hips,
    )[side];
    const sign: number = side === "left" ? 1 : -1;
    return Vector3.add(
      hip,
      Quaternion.rotateVector(turn, {
        x: sign * TARGET.x * body.measure.thigh,
        y: TARGET.y * body.measure.thigh,
        z: TARGET.z * body.measure.thigh,
      }),
    );
  }

  /** Refuse a stroke that cannot be staged. */
  function refuse(axis: string, value: unknown, reason: string): never {
    throw new HumanRefusal({
      kind: "parameter",
      axis,
      value,
      feasible: null,
      reason,
      fix: "time the strokes inside a hold whose hand holds a rein, a stroke's reach apart",
    });
  }
}
