import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanKickGeometry,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieSuperposeMinimumJerk,
  IAutoMovieVector3,
} from "@automovie/interface";

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
    carriage: IAutoMovieMotionHumanKickGeometry.ICarriage;

    /** Its leg's free path. */
    leg: IAutoMovieMotionHumanKickGeometry["leg"];
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
    units(seconds: number): readonly IAutoMovieSuperposeMinimumJerk.IUnit[];

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
    shown(turning: number): IAutoMovieMotionHumanKickGeometry.ICarriage;

    /**
     * The kicking leg's goal on its free path under a given body.
     *
     * @param clock Seconds since the start on the leg's own clock.
     * @param base The body's posture the leg hangs from.
     * @param shift How far the launch plant has moved, world metres.
     * @param hip Optional kicking hip from this exact base, shared by the same-time candidate paths.
     * @returns The leg's goal.
     */
    leg(
      clock: number,
      base: IAutoMovieMotionHumanPosture,
      shift: IAutoMovieVector3,
      hip?: IAutoMovieVector3,
    ): IAutoMovieMotionHumanKickGeometry.ILeg;
  }

  /**
   * Superpose a kick's plans.
   *
   * @param props The first plan, how a corrected goal is planned, and the units.
   * @returns The shown carriage and leg as pure functions of the kick's seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States online correction ownership, launch-relative clocks and same-base optional hip sharing.
   * @evidence contracts/development/implementation.md#principled-implementation Builds each started correction's original whole contact/path plan, then superposes its minimum-jerk carriage and leg differences in observation order, retaining the original quaternion composition.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One started-plan owner serves carriage and leg evaluation; the caller supplies one current hip through all plans that hang from that exact base.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every started observation, near-zero displacement rule, path evaluation, blend weight and transform order; no correction, physical plan or sample is skipped.
   * @evidence contracts/development/implementation.md#efficient-algorithms For C started corrections, retains O(C) blending and actual plan/path costs; one caller-read hip replaces repeated identical-base hip FK across these paths. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Started correction plans retain their existing observation-index ownership; only one explicit same-body/base hip value is borrowed by that call's paths, with no current pose or time-result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Existing plans grow with the finite tracker observation count and end with the geometry; temporary started/leg records end each call and no supplied hip or body evaluation reader is retained.
   */
  export function create(props: IProps): IPlans {
    const plans: IPlan[] = [props.first];
    const started = (clock: number): IStarted[] => {
      const units: readonly IAutoMovieSuperposeMinimumJerk.IUnit[] = props.units(
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
        (u: IAutoMovieSuperposeMinimumJerk.IUnit, i: number): IStarted => ({
          from: plans[i]!,
          to: plans[i + 1]!,
          weight: minimumJerk.share(
            (props.t0 + clock - u.start) / Math.max(1e-9, u.duration),
          ),
        }),
      );
    };
    return {
      shown: (turning: number): IAutoMovieMotionHumanKickGeometry.ICarriage =>
        started(turning).reduce(
          (c: IAutoMovieMotionHumanKickGeometry.ICarriage, s: IStarted): IAutoMovieMotionHumanKickGeometry.ICarriage => ({
            turn: c.turn + s.weight * (s.to.carriage.turn - s.from.carriage.turn),
            lean: c.lean + s.weight * (s.to.carriage.lean - s.from.carriage.lean),
            pitch:
              c.pitch + s.weight * (s.to.carriage.pitch - s.from.carriage.pitch),
            step: c.step + s.weight * (s.to.carriage.step - s.from.carriage.step),
            drive: c.drive + s.weight * (s.to.carriage.drive - s.from.carriage.drive),
          }),
          props.first.carriage,
        ),
      leg: (
        clock: number,
        base: IAutoMovieMotionHumanPosture,
        shift: IAutoMovieVector3,
        hip?: IAutoMovieVector3,
      ): IAutoMovieMotionHumanKickGeometry.ILeg => {
        let out: IAutoMovieMotionHumanKickGeometry.ILeg = props.first.leg(clock, base, shift, hip);
        let before: IAutoMovieMotionHumanKickGeometry.ILeg = out;
        for (const s of started(clock)) {
          if (s.to === s.from) continue;
          const after: IAutoMovieMotionHumanKickGeometry.ILeg = s.to.leg(clock, base, shift, hip);

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
