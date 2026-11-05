import { Ease } from "./Ease";
import { Vec3 } from "./Vec3";

/**
 * Converts a foot placement on the canvas into ankle and ball goals for {@link BodyRig}.
 *
 * @evidence contracts/common.md#implementation-and-ownership A placement is anchored at the ball of the foot because fighters pivot and rise on the ball; raising the heel rotates the ankle about that point, so the ball stays planted while the heel lifts. The neutral ankle-to-ball vector comes from the actual Human FK, not an assumed foot length.
 * @evidence contracts/common.md#authoring-interface `ball` is world X/Z metres on the floor, `yaw` is the world heading the toes point along (three.js sign), `heel` is the heel-raise pitch in radians and `lift` raises the whole foot in metres for a swing.
 */
export namespace Foot {
  /** Height of the ball joint above the canvas when the foot is flat, metres (Human neutral). */
  export const BALL_HEIGHT: number = 0.014;

  /**
   * One foot on or above the canvas.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain placement.
   * @evidence contracts/common.md#authoring-interface World X/Z metres, radians and metres as named.
   */
  export interface Placement {
    /** World X/Z of the ball of the foot, metres. */
    ball: readonly [number, number];

    /** World heading of the toes, radians. */
    yaw: number;

    /** Heel raise about the ball, radians; 0 is flat. */
    heel: number;

    /** Whole-foot clearance above the canvas, metres. */
    lift: number;
  }

  /**
   * Ankle and ball goals for one placement.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain goal pair.
   * @evidence contracts/common.md#authoring-interface World metres.
   */
  export interface Goals {
    /** Ankle joint centre, world metres. */ ankle: Vec3.Value;
    /** Ball of the foot, world metres. */ ball: Vec3.Value;
  }

  /**
   * Resolve world goals from a placement and the body's neutral ankle-to-ball vector.
   *
   * @evidence contracts/common.md#implementation-and-ownership Rotates the neutral foot about the ball by the heel pitch, then about +Y by the toe heading. Pure function.
   * @evidence contracts/common.md#authoring-interface `footVector` is BodyRig.footVector (ankle to ball in the body frame, metres).
   */
  export function goals(placement: Placement, footVector: Vec3.Value): Goals {
    const along: number = Math.hypot(footVector[0], footVector[2]);
    const drop: number = -footVector[1];

    // Ankle relative to the ball in the foot's sagittal plane, pitched up by the heel raise.
    const c: number = Math.cos(placement.heel);
    const s: number = Math.sin(placement.heel);
    const back: number = -along * c - drop * s;
    const up: number = drop * c + along * s;
    const ball: Vec3.Value = [
      placement.ball[0],
      BALL_HEIGHT + placement.lift,
      placement.ball[1],
    ];
    return {
      ball,
      ankle: Vec3.add(ball, Vec3.rotateY([back, up, 0], placement.yaw)),
    };
  }

  /**
   * Interpolate a swing between two placements with a lifted arc.
   *
   * @evidence contracts/common.md#implementation-and-ownership Quintic progress gives zero velocity at lift-off and touch-down; the arc height is a sine bump so the foot never drags through the canvas.
   * @evidence contracts/common.md#authoring-interface `u` is unit swing progress; `height` is the peak clearance in metres.
   */
  export function swing(
    from: Placement,
    to: Placement,
    u: number,
    height: number,
  ): Placement {
    const k: number = Ease.smoother(u);
    return {
      ball: [
        Ease.lerp(from.ball[0], to.ball[0], k),
        Ease.lerp(from.ball[1], to.ball[1], k),
      ],
      yaw: Ease.angle(from.yaw, to.yaw, k),
      heel:
        Ease.lerp(from.heel, to.heel, k) +
        0.25 * Math.sin(Math.PI * Ease.unit(u)),
      lift: height * Math.sin(Math.PI * Ease.unit(u)),
    };
  }
}
