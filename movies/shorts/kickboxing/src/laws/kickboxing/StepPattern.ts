import type { RingFootwork } from "./RingFootwork";

/**
 * Discrete footsteps of a movement: the stance origin travels along its path
 * while each foot steps in turn from its placement to its next one, the foot
 * on the side of travel first and the other following to restore the stance,
 * so the feet never cross and a foot is planted except during its own swing.
 *
 * ```ts
 * StepPattern.foot({ steps: 4, first: "left", share: 0.3 }, "right");
 * ```
 *
 * @evidence docs/research/kickboxing/ring-generalship.md#sources The foot on the side of travel moves first and the other follows to restore the stance (IBA pages 36-39).
 * @evidence docs/research/kickboxing/ring-generalship.md#step One step per half second, at most half the stance length.
 */
export namespace StepPattern {
  /** Swing foot clearance over the canvas, as a share of the ankle height: a short supported step slides just clear of the mat (film choice). */
  export const LIFT_SHARE: number = 0.5;

  /** One foot's state at an instant of a movement. */
  export interface IFoot {
    /** Share of the movement's origin path at which the foot's current or last placement was taken. */
    from: number;

    /** Share at which its next placement is taken. */
    to: number;

    /** Progress of its swing in [0, 1]; 0 or 1 while planted. */
    swing: number;
  }

  /**
   * Which origin shares a foot stands on at a share of the movement. Steps
   * alternate feet, the first foot leading; a foot's swing carries it from the
   * origin share at its previous landing to the share at the end of its step.
   *
   * @param input The step count, the leading foot and the movement's progress in [0, 1].
   * @param side The foot.
   * @returns Its placement shares and swing progress.
   * @evidence docs/research/kickboxing/ring-generalship.md#sources Alternating, leading with the direction-side foot.
   */
  export function foot(
    input: { steps: number; first: "left" | "right"; share: number },
    side: "left" | "right",
  ): IFoot {
    const n: number = Math.max(1, Math.round(input.steps));
    const position: number = Math.max(0, Math.min(1, input.share)) * n;
    const index: number = Math.min(n - 1, Math.floor(position));
    const own: number = side === input.first ? 0 : 1;
    // The leading foot steps a step ahead of the origin and the following
    // foot restores the stance; each foot's last step reaches the end.
    const target = (step: number): number =>
      step < 0 ? 0 : step + 2 >= n ? 1 : (step + 1 + (own === 0 ? 1 : 0)) / n;
    if (index % 2 === own)
      return {
        from: target(index - 2),
        to: target(index),
        swing: position - index,
      };
    const planted: number = target(index - 1);
    return { from: planted, to: planted, swing: 1 };
  }

  /**
   * The foot that leads a movement: the one on the side the origin travels toward, seen in the fighter's facing frame.
   *
   * @param from Origin at the start.
   * @param to Origin at the end.
   * @param facing Unit facing direction at the start.
   * @returns The leading foot.
   * @evidence docs/research/kickboxing/ring-generalship.md#sources Direction-side foot first; forward steps lead with the lead foot, backward with the rear.
   */
  export function leading(
    from: RingFootwork.IPoint,
    to: RingFootwork.IPoint,
    facing: RingFootwork.IPoint,
  ): "left" | "right" {
    const dx: number = to.x - from.x;
    const dz: number = to.z - from.z;
    const forward: number = dx * facing.x + dz * facing.z;
    const left: number = -dx * facing.z + dz * facing.x;
    if (Math.abs(forward) >= Math.abs(left))
      return forward >= 0 ? "left" : "right";
    return left >= 0 ? "left" : "right";
  }

  /**
   * Clearance of a swinging foot at a swing progress, as a share of the full lift.
   *
   * @param swing Swing progress in [0, 1].
   * @returns Lift share in [0, 1].
   * @evidence docs/research/kickboxing/ring-generalship.md#step Short supported steps.
   */
  export function lift(swing: number): number {
    return swing <= 0 || swing >= 1 ? 0 : Math.sin(Math.PI * swing);
  }
}
