import { AutoMovieGravity, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { GymnasticsFlight } from "../sport/GymnasticsFlight";

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
  const from: IAutoMovieMotionHumanPosture = plan.posture(t0);
  const to: IAutoMovieMotionHumanPosture = plan.posture(t1);
  const a: IAutoMovieMotionHumanPosture["joints"] = GymnasticsFlight.frozen(
    body,
    from,
  ).joints;
  const b: IAutoMovieMotionHumanPosture["joints"] = GymnasticsFlight.frozen(
    body,
    to,
  ).joints;
  const g: number = AutoMovieGravity.STANDARD;

  // The bones either key poses, in the keys' order, and whether each is an
  // arm's, which reaches over the flight's first half: fixed by the keys.
  const bones: Array<keyof IAutoMovieMotionHumanPosture["joints"]> = [
    ...(new Set([...Object.keys(a), ...Object.keys(b)]) as Set<
      keyof IAutoMovieMotionHumanPosture["joints"]
    >),
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
  // Nothing bears in the air: a contact still declared into the flight (the
  // feet leaving the wall and the floor) ends at the take-off, and one
  // declared from within it (the hands) starts at the catch.
  const off: number = t0 / plan.duration;
  const on: number = t1 / plan.duration;
  const contacts: IAutoMovieMotionHumanContactWindow[] = plan.contacts.map(
    (
      window: IAutoMovieMotionHumanContactWindow,
    ): IAutoMovieMotionHumanContactWindow =>
      window.from < on && window.to > off
        ? window.from <= off
          ? { ...window, to: off }
          : { ...window, from: on }
        : window,
  );
  return {
    ...plan,
    contacts,
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
      const tau: number = seconds - t0;
      const s: number = tau / span;
      const shaped: number = minimumJerk.share(s);
      const reached: number = minimumJerk.share(Math.min(1, 2 * s));
      const joints: IAutoMovieMotionHumanPosture["joints"] = {};
      for (let k: number = 0; k < bones.length; ++k) {
        const bone: keyof IAutoMovieMotionHumanPosture["joints"] = bones[k]!;
        const p: readonly [number, number, number] = a[bone] ?? [0, 0, 0];
        const q: readonly [number, number, number] = b[bone] ?? [0, 0, 0];
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
}
