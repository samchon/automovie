import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBoutPosture } from "./IBoutPosture";
import type { IFighterMeasure } from "./IFighterMeasure";
import { blendPosture } from "./blendPosture";

/**
 * The knocked-down fighter's shapes: the connected fall onto the right side
 * after the finishing blow, the lying rest, and the failed attempts to rise
 * through the left arm during the count. Keys are seconds since the blow;
 * the performance settles the root so the lowest collider rests on the
 * canvas, so these shapes never place the body in world coordinates.
 *
 * ```ts
 * KnockdownShape.fall(measure, guard, rest, seconds);
 * KnockdownShape.attempt(measure, lying, rest, share);
 * ```
 *
 * @evidence docs/body/screenplay/kickboxing.md#s11-b01 The head is driven toward the right shoulder, the right knee folds, the right hip and side take the canvas before the shoulder, the head settles last.
 * @evidence docs/body/screenplay/kickboxing.md#s11-b03 The left forearm braces, the chest rises with the right hip down, the arm trembles and the chest lowers again.
 * @evidence docs/research/kickboxing/rules.md#uncertainty Loss of support is shown; no injury mechanism is asserted.
 */
export namespace KnockdownShape {
  /** Seconds from the blow until he lies on his side: the screenplay's 150.000 to 151.600. */
  export const FALL_SECONDS: number = 1.6;

  /** Share of the fall at which the right knee has folded and the hip meets the canvas. */
  const HIP_DOWN: number = 0.55;

  /** Share of the fall at which the head is driven to the right shoulder. */
  const HEAD_DRIVEN: number = 0.15;

  /**
   * The falling posture at seconds since the blow.
   *
   * @param measure His measure.
   * @param guard His guard posture.
   * @param rest Body-frame ankle points of his planted feet.
   * @param seconds Seconds since the blow, clamped to the fall.
   * @returns The posture.
   * @evidence docs/body/screenplay/kickboxing.md#s11-b01 The ordered fall.
   */
  export function fall(
    measure: IFighterMeasure,
    guard: IBoutPosture,
    rest: Record<"left" | "right", IAutoMovieVector3>,
    seconds: number,
  ): IBoutPosture {
    const share: number = Math.max(0, Math.min(1, seconds / FALL_SECONDS));
    const struck: IBoutPosture = {
      ...guard,
      cervical: { flexion: 0, lateralFlexion: -40, rotation: 10 },
      thoracic: { ...guard.thoracic, lateralFlexion: -15 },
      wince: 1,
    };
    const folding: IBoutPosture = {
      ...struck,
      drop: measure.hip * 0.5,
      roll: Math.PI / 6,
      pitch: Math.PI / 12,
      hands: {
        left: {
          point: {
            x: measure.headRadius * 2,
            y: measure.shoulder - measure.hip * 0.5,
            z: measure.shoulderHalfWidth,
          },
        },
        right: {
          point: {
            x: measure.headRadius,
            y: measure.hip * 0.3,
            z: -measure.shoulderHalfWidth * 1.5,
          },
        },
      },
    };
    const lying: IBoutPosture = rest_(measure, guard);
    if (share <= HEAD_DRIVEN)
      return blendPosture(guard, struck, ease(share / HEAD_DRIVEN), rest);
    if (share <= HIP_DOWN)
      return blendPosture(
        struck,
        folding,
        ease((share - HEAD_DRIVEN) / (HIP_DOWN - HEAD_DRIVEN)),
        rest,
      );
    return blendPosture(
      folding,
      lying,
      ease((share - HIP_DOWN) / (1 - HIP_DOWN)),
      rest,
    );
  }

  /**
   * The lying rest on the right side: knees and hips bent, left arm before the chest.
   *
   * @param measure His measure.
   * @param guard His guard posture, for its untouched channels.
   * @returns The posture.
   * @evidence docs/body/screenplay/kickboxing.md#s11-b01 On his right side with bent knees and arms.
   */
  export function lying(
    measure: IFighterMeasure,
    guard: IBoutPosture,
  ): IBoutPosture {
    return rest_(measure, guard);
  }

  /**
   * The floor the lying body covers: a capsule from his pelvis over his
   * stance origin toward the right side he falls on, as long as pelvis to
   * head, as wide as his bent knees reach forward (a thigh), which is wider
   * than his chest's depth.
   *
   * @param measure His measure.
   * @param origin His stance origin when he falls.
   * @param facing His facing when he falls.
   * @returns The floor capsule's axis ends and radius, metres.
   * @evidence docs/body/screenplay/kickboxing.md#s11-b01 On his right side with bent knees and arms.
   */
  export function footprint(
    measure: IFighterMeasure,
    origin: { x: number; z: number },
    facing: { x: number; z: number },
  ): IFootprint {
    // His right is -Z of his own frame facing +X.
    const right: { x: number; z: number } = { x: facing.z, z: -facing.x };
    const length: number = measure.head - measure.hip;
    return {
      from: { x: origin.x, z: origin.z },
      to: { x: origin.x + right.x * length, z: origin.z + right.z * length },
      radius: measure.thigh,
    };
  }

  /** A floor capsule. */
  export interface IFootprint {
    /** Axis start on the floor. */
    from: { x: number; z: number };

    /** Axis end on the floor. */
    to: { x: number; z: number };

    /** Radius, metres. */
    radius: number;
  }

  /**
   * A failed attempt to rise at a share of its course: the left forearm braces,
   * the chest rises through it, trembles, and lowers again.
   *
   * @param measure His measure.
   * @param lyingPosture The lying posture.
   * @param rest Body-frame foot points.
   * @param share Progress of the attempt in [0, 1].
   * @param effort The attempt's height in [0, 1], drawn by the caller.
   * @returns The posture.
   * @evidence docs/body/screenplay/kickboxing.md#s11-b03 Brace, push, tremble and lower.
   */
  export function attempt(
    measure: IFighterMeasure,
    lyingPosture: IBoutPosture,
    rest: Record<"left" | "right", IAutoMovieVector3>,
    share: number,
    effort: number,
  ): IBoutPosture {
    const pushed: IBoutPosture = {
      ...lyingPosture,
      roll: lyingPosture.roll * (1 - 0.35 * effort),
      thoracic: { ...lyingPosture.thoracic, lateralFlexion: 10 * effort },
      cervical: { ...lyingPosture.cervical, lateralFlexion: 10 * effort },
      hands: {
        ...lyingPosture.hands,
        left: {
          point: {
            x: measure.headRadius * 2,
            y: measure.shoulder - measure.hip * 0.9,
            z: -measure.shoulderHalfWidth * 0.2,
          },
        },
      },
    };
    const up: number = Math.sin(Math.PI * Math.max(0, Math.min(1, share)));
    return blendPosture(lyingPosture, pushed, up, rest);
  }

  function rest_(measure: IFighterMeasure, guard: IBoutPosture): IBoutPosture {
    return {
      ...guard,
      drop: measure.hip * 0.6,
      yaw: guard.yaw,
      roll: Math.PI / 2,
      pitch: 0,
      thoracic: { flexion: 15, lateralFlexion: 0, rotation: 0 },
      lumbar: { flexion: 10, lateralFlexion: 0 },
      cervical: { flexion: 10, lateralFlexion: -15, rotation: 0 },
      hands: {
        left: {
          point: {
            x: measure.headRadius * 2.5,
            y: measure.shoulder - measure.hip * 0.6,
            z: 0,
          },
        },
        right: {
          point: {
            x: measure.headRadius * 2,
            y: measure.head - measure.hip * 0.6 - measure.headRadius * 2,
            z: -measure.shoulderHalfWidth,
          },
        },
      },
      feet: {
        left: {
          point: {
            x: measure.thigh * 0.6,
            y: measure.ankle,
            z: measure.hipHalfWidth,
          },
          knee: {
            x: measure.thigh * 0.7,
            y: measure.hip * 0.5,
            z: measure.hipHalfWidth,
          },
        },
        right: {
          point: {
            x: measure.thigh * 0.3,
            y: measure.ankle,
            z: -measure.hipHalfWidth,
          },
          knee: {
            x: measure.thigh * 0.6,
            y: measure.hip * 0.5,
            z: -measure.hipHalfWidth,
          },
        },
      },
      jaw: 6,
      wince: 0.8,
    };
  }

  /** Smoothstep easing of a progress in [0, 1]. */
  function ease(t: number): number {
    const x: number = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  }
}
