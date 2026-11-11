import {
  Quaternion,
  Vector3,
  minimumJerk,
  type superposeMinimumJerk,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanPosture } from "../posture/IHumanPosture";
import type { IKickGeometry } from "./IKickGeometry";

/**
 * A kick following a target that moves: one whole plan per goal, superposed.
 *
 * The aim's tracker ({@link StrikingAim}) moves the goal by one correction
 * unit per observation. A kick cannot answer such a unit by displacing its
 * ankle alone: its contact leg is fitted at the edge of the hip's range of
 * motion, where the same hip cannot hold the ankle a few centimetres aside.
 * So each corrected goal gets a plan of its own, fitted like the first (its
 * carriage and its leg), and the figure moves from each plan to the next on
 * that unit's own minimum-jerk weight (Flash and Henis 1991: a second unit
 * superposed on the first, here on the whole plan instead of on one point).
 * At the contact every weight is one, so the figure is exactly the last
 * plan, whose leg was fitted onto the last goal.
 *
 * A plan is built when its unit has started, never before, so no instant
 * reads the target ahead of itself; a unit that moves nothing reuses the plan
 * before it.
 */
export namespace KickPlans {
  /** One goal's plan. */
  export interface IPlan {
    /** The planned contact point, world metres. */
    goal: IAutoMovieVector3;

    /** The carriage its contact settled on. */
    carriage: IKickGeometry.ICarriage;

    /** Its leg's free path. */
    leg: IKickGeometry["leg"];
  }

  /** What the superposition is built from. */
  export interface IProps {
    /** The plan made at the launch. */
    first: IPlan;

    /**
     * Plan a corrected goal.
     *
     * @param previous The plan the correction starts from.
     * @param goal The corrected contact point, world metres.
     * @returns The plan.
     */
    next(previous: IPlan, goal: IAutoMovieVector3): IPlan;

    /**
     * The correction units started by a second, in observation order.
     *
     * @param seconds Film seconds.
     * @returns The units, start and duration in film seconds.
     */
    units(seconds: number): readonly superposeMinimumJerk.IUnit[];

    /** Film second of the kick's time zero. */
    t0: number;
  }

  /** The superposed plans. */
  export interface IPlans {
    /**
     * The carriage shown at a second.
     *
     * @param turning Seconds since the kick's start at which the turn is read.
     * @returns The carriage.
     */
    shown(turning: number): IKickGeometry.ICarriage;

    /**
     * The kicking leg's goal on its free path under a given body.
     *
     * @param clock Seconds since the start on the leg's own clock.
     * @param base The body's posture the leg hangs from.
     * @param shift How far the launch plant has moved, world metres.
     * @returns The leg's goal.
     */
    leg(
      clock: number,
      base: IHumanPosture,
      shift: IAutoMovieVector3,
    ): IKickGeometry.ILeg;
  }

  /**
   * Superpose a kick's plans.
   *
   * @param props The first plan, how a corrected goal is planned, and the units.
   * @returns The shown carriage and leg as pure functions of the kick's seconds.
   */
  export function create(props: IProps): IPlans {
    const plans: IPlan[] = [props.first];
    const started = (clock: number): IStarted[] => {
      const units: readonly superposeMinimumJerk.IUnit[] = props.units(
        props.t0 + clock,
      );
      for (let k: number = plans.length; k <= units.length; k++) {
        const previous: IPlan = plans[k - 1]!;
        const moved: IAutoMovieVector3 = units[k - 1]!.displacement;
        plans.push(
          Vector3.length(moved) < 1e-9
            ? previous
            : props.next(previous, Vector3.add(previous.goal, moved)),
        );
      }
      return units.map(
        (u: superposeMinimumJerk.IUnit, i: number): IStarted => ({
          from: plans[i]!,
          to: plans[i + 1]!,
          weight: minimumJerk(
            (props.t0 + clock - u.start) / Math.max(1e-9, u.duration),
          ).s,
        }),
      );
    };
    return {
      shown: (turning: number): IKickGeometry.ICarriage =>
        started(turning).reduce(
          (c: IKickGeometry.ICarriage, s: IStarted): IKickGeometry.ICarriage => ({
            turn: c.turn + s.weight * (s.to.carriage.turn - s.from.carriage.turn),
            lean: c.lean + s.weight * (s.to.carriage.lean - s.from.carriage.lean),
            pitch:
              c.pitch + s.weight * (s.to.carriage.pitch - s.from.carriage.pitch),
            step: c.step + s.weight * (s.to.carriage.step - s.from.carriage.step),
          }),
          props.first.carriage,
        ),
      leg: (
        clock: number,
        base: IHumanPosture,
        shift: IAutoMovieVector3,
      ): IKickGeometry.ILeg => {
        let out: IKickGeometry.ILeg = props.first.leg(clock, base, shift);
        let before: IKickGeometry.ILeg = out;
        for (const s of started(clock)) {
          if (s.to === s.from) continue;
          const after: IKickGeometry.ILeg = s.to.leg(clock, base, shift);

          // The foot's rotation moves by the same share of the turn that
          // carries one plan's foot onto the next.
          const turned: IAutoMovieQuaternion = Quaternion.slerp(
            { x: 0, y: 0, z: 0, w: 1 },
            Quaternion.multiply(
              after.rotation,
              Quaternion.inverse(before.rotation),
            ),
            s.weight,
          );
          out = {
            ankle: Vector3.add(
              out.ankle,
              Vector3.scale(
                Vector3.subtract(after.ankle, before.ankle),
                s.weight,
              ),
            ),
            hint: Vector3.add(
              out.hint,
              Vector3.scale(Vector3.subtract(after.hint, before.hint), s.weight),
            ),
            rotation: Quaternion.normalize(
              Quaternion.multiply(turned, out.rotation),
            ),
          };
          before = after;
        }
        return out;
      },
    };
  }

  /** One started correction: the plans it moves between and how far it has run. */
  interface IStarted {
    /** The plan before the correction. */
    from: IPlan;

    /** The plan after it. */
    to: IPlan;

    /** The unit's minimum-jerk progress, in [0, 1]. */
    weight: number;
  }
}
