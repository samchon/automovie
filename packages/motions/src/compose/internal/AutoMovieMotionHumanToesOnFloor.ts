import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";

/*
 * The toes of a foot risen on its ball, bent back so they lie on the support.
 * Without the bend the risen foot's toes turn down with the foot, their tips go
 * under the support, and there they become its lowest point and slide as the
 * heel rises. The keyed dances (`DanceFootwork`) and the line walk (`lineWalk`)
 * share it.
 */
export namespace AutoMovieMotionHumanToesOnFloor {
  /*
   * How near the floor a risen ball starts to bend its toes back, metres: they
   * lie flat once it is down (provisional).
   */
  export const TOUCH: number = 0.03;

  /*
   * How far a foot risen on its ball bends its toes back: by the heel's lift
   * about the toes' joint, in full once the ball is down, fading out over
   * `TOUCH` above the support on a smoothstep, so a foot leaving or reaching
   * the support bends them continuously; and above it, at least as far as keeps
   * the toes' tip from passing under the support.
   * Parameter body: The body.
   * Parameter side: The foot.
   * Parameter at: The foot's placement, its pitch read for the heel's lift.
   * Parameter floor: The support's height under the ball, world metres.
   * Returns: The toes' extension, degrees, at least 0.
   */
  export function bend(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    at: IAutoMovieMotionHumanFoot.IPlacement,
    floor: number,
  ): number {
    const lift: number = -HumanFoot.pitch(at.rotation);
    const ball: IAutoMovieVector3 = HumanFoot.point(body, side, "ball", at);
    const near: number = Math.max(0, Math.min(1, 1 - (ball.y - floor) / TOUCH));
    const faded: number = Math.max(0, lift) * near * near * (3 - 2 * near);
    // Above the support the toes still bend at their joint as far as keeps
    // their tip on it: a foot pitched toes down nearing the floor (a risen
    // foot landing, a heel lifted in the air) would otherwise put the tips
    // under the support before the ball is down. The toes turn about the
    // ball, so the tip's angle below it may be no more than the one that
    // reaches down to the support (closed form, by the arcsine).
    const toe: IAutoMovieVector3 = HumanFoot.point(body, side, "toe", at);
    const length: number = Vector3.distance(ball, toe);
    if (!(length > 1e-9)) return faded;
    const down = (drop: number): number =>
      (Math.asin(Math.max(-1, Math.min(1, drop / length))) * 180) / Math.PI;
    return Math.max(faded, down(ball.y - toe.y) - down(ball.y - floor));
  }

  /*
   * A leg row whose foot bends its toes onto its support: the row's own
   * posture, with the toes extended by `bend` for the foot the row's goal
   * places.
   * Parameter body: The body.
   * Parameter side: The foot.
   * Parameter leg: The leg row.
   * Parameter floor: The support's height under a ball, world metres, by the ankle
   * the goal places.
   * Returns: The row, its write bending the toes.
   */
  export function row(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    leg: IAutoMovieMotionHumanPrimitive,
    floor: (ankle: IAutoMovieVector3) => number,
  ): IAutoMovieMotionHumanPrimitive {
    return {
      ...leg,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        t: number,
        before?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[2],
        resolution?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[3],
        projection?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[4],
      ): IAutoMovieMotionHumanPosture => {
        const written: IAutoMovieMotionHumanPosture = leg.write(
          posture,
          t,
          before,
          resolution,
          projection,
        );
        const goal: IAutoMovieHumanLimbGoal | undefined =
          written.limbs[`${side}Leg`];
        if (goal?.rotation === undefined) return written;
        const toes: number = bend(
          body,
          side,
          { ankle: goal.point, rotation: goal.rotation },
          floor(goal.point),
        );
        return toes > 0
          ? {
              ...written,
              joints: { ...written.joints, [`${side}Toes`]: [toes, 0, 0] },
            }
          : written;
      },
    };
  }
}
