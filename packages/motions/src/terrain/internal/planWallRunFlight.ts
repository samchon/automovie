import { AutoMovieGravity, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPreparedPlayback } from "../../perform/HumanPreparedPlayback";
import { GymnasticsFlight } from "../../sport/GymnasticsFlight";

/**
 * A wall run's catch flown: between the wall step's key and the hang's the
 * support plan's posture is replaced by a projectile of the root under standard
 * gravity that leaves the one key and arrives at the other in the stances'
 * time, the joints taken from both keys' solved angles, the arms reaching for
 * the top over the flight's first half.
 *
 * @param body The body.
 * @param plan The support plan with its `wallStep` and `catch` events.
 * @returns The plan with the catch flown.
 */
export function planWallRunFlight(
  body: IAutoMovieMotionHumanBody,
  plan: IAutoMovieMotionHumanActionPlan,
): IAutoMovieMotionHumanActionPlan {
  const at: (name: string) => number = (name: string): number =>
    plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share * plan.duration;
  const t0: number = at("wallStep");
  const t1: number = at("catch");
  const span: number = t1 - t0;
  const g: number = AutoMovieGravity.STANDARD;

  const capture = (): IFlight => {
    const from: IAutoMovieMotionHumanPosture = GymnasticsFlight.frozen(
      body,
      plan.posture(t0),
    );
    const to: IAutoMovieMotionHumanPosture = GymnasticsFlight.frozen(
      body,
      plan.posture(t1),
    );
    // The bones either key poses, in the keys' order, and whether each is an
    // arm's, which reaches over the flight's first half: fixed by the keys.
    const bones: Array<keyof IAutoMovieMotionHumanPosture["joints"]> = [
      ...(new Set([
        ...Object.keys(from.joints),
        ...Object.keys(to.joints),
      ]) as Set<keyof IAutoMovieMotionHumanPosture["joints"]>),
    ];
    const arms: boolean[] = bones.map(
      (bone: keyof IAutoMovieMotionHumanPosture["joints"]): boolean =>
        /Arm$/.test(bone),
    );
    // The take-off velocity that lands the projectile on the hang's root.
    const v: IAutoMovieVector3 = {
      x: (to.root.x - from.root.x) / span,
      y: (to.root.y - from.root.y + 0.5 * g * span * span) / span,
      z: (to.root.z - from.root.z) / span,
    };
    return { from, to, bones, arms, v };
  };
  let flight: IFlight = capture();
  // Nothing bears in the air: a contact still declared into the flight (the
  // feet leaving the wall and the floor) ends at the take-off, and one
  // declared from within it (the hands) starts at the catch.
  const off: number = t0 / plan.duration;
  const on: number = t1 / plan.duration;
  const contacts: IAutoMovieMotionHumanContactWindow[] = plan.contacts.flatMap(
    (
      window: IAutoMovieMotionHumanContactWindow,
    ): IAutoMovieMotionHumanContactWindow[] => {
      if (window.from >= on || window.to <= off) return [window];
      return [
        ...(window.from <= off ? [{ ...window, to: off }] : []),
        ...(window.to >= on ? [{ ...window, from: on }] : []),
      ];
    },
  );
  const result: IAutoMovieMotionHumanActionPlan = {
    ...plan,
    contacts,
    prepare: (): void => {
      plan.prepare?.();
      flight = capture();
    },
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      evaluation?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[4],
    ): IAutoMovieMotionHumanPosture => {
      if (!(seconds > t0 && seconds < t1))
        return plan.posture(
          seconds,
          channels,
          resolution,
          projection,
          evaluation,
        );
      const { from, to, bones, arms, v }: IFlight = flight;
      const tau: number = seconds - t0;
      const s: number = tau / span;
      const shaped: number = minimumJerk.share(s);
      const reached: number = minimumJerk.share(Math.min(1, 2 * s));
      const joints: IAutoMovieMotionHumanPosture["joints"] = {};
      for (let k: number = 0; k < bones.length; ++k) {
        const bone: keyof IAutoMovieMotionHumanPosture["joints"] = bones[k]!;
        const p: readonly [number, number, number] = from.joints[bone] ?? [
          0, 0, 0,
        ];
        const q: readonly [number, number, number] = to.joints[bone] ?? [
          0, 0, 0,
        ];
        const w: number = arms[k]! ? reached : shaped;
        joints[bone] = [
          p[0] + (q[0] - p[0]) * w,
          p[1] + (q[1] - p[1]) * w,
          p[2] + (q[2] - p[2]) * w,
        ];
      }
      return {
        root: {
          x: from.root.x + v.x * tau,
          y: from.root.y + v.y * tau - 0.5 * g * tau * tau,
          z: from.root.z + v.z * tau,
        },
        yaw: from.yaw + (to.yaw - from.yaw) * shaped,
        pitch: from.pitch + (to.pitch - from.pitch) * shaped,
        roll: from.roll + (to.roll - from.roll) * shaped,
        joints,
        limbs: {},
      };
    },
  };
  return HumanPreparedPlayback.rebindPosture(result, plan, body);
}

/** Prepared endpoints and projectile velocity for the wall-run catch. */
interface IFlight {
  /** Released pose at the wall step. */
  from: IAutoMovieMotionHumanPosture;
  /** Catching pose at the next wall hold. */
  to: IAutoMovieMotionHumanPosture;
  /** Joints that have to join the locked support poses. */
  bones: Array<keyof IAutoMovieMotionHumanPosture["joints"]>;
  /** Whether each joint reaches on the earlier arm clock. */
  arms: boolean[];
  /** World take-off velocity, metres per second. */
  v: IAutoMovieVector3;
}
