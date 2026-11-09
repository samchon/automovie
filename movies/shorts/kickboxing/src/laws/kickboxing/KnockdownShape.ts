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

  /** Share of the fall at which the knees have buckled and the limp body is down to the canvas: postural tone is lost within the first second of a knockout (fight-footage reading). */
  const HIP_DOWN: number = 0.4;

  /** Arm reach share of the fencing response: both arms stiffen forward and up, nearly extended, the posturing seen at knockouts (Hosseini and Lifshitz 2009, the fencing response); the share is a staging choice. */
  const FENCING_REACH: number = 0.8;

  /** The head kick's snap, degrees: thrown back, driven to the right shoulder at the cervical side-bend limit of about 45 degrees and turned along the kick's travel; a staging choice within the cervical ranges. */
  const SNAP = { flexion: -20, lateralFlexion: -45, rotation: -35 } as const;

  /** Root drop of the buckled knees as a share of the hip height: the hips near the knees' height, about two thirds down. */
  const BUCKLE: number = 0.65;

  /** Roll toward the right of the limp drop, radians: halfway to lying on the side. */
  const LIMP_ROLL: number = Math.PI / 4;

  /** Forward pitch of the limp drop, radians: the trunk falls forward with no tone. */
  const LIMP_PITCH: number = Math.PI / 9;

  /** Trunk of the limp drop, degrees: slumped forward and to the right. */
  const LIMP_TRUNK = { flexion: 25, lateralFlexion: -20, rotation: 0 } as const;

  /** Lumbar flexion of the limp drop, degrees. */
  const LIMP_LUMBAR = { flexion: 15, lateralFlexion: 0 } as const;

  /** Neck of the limp drop, degrees: the head lolling forward and right. */
  const LIMP_NECK = { flexion: 30, lateralFlexion: -35, rotation: -20 } as const;

  /** How far the limp arms hang below the shoulder, as a share of their reach. */
  const HANGING: number = 0.6;

  /** Share of the lying roll undone by the push-up, at full effort: the shoulders off the canvas onto the forearm. */
  const PUSH_UNROLL: number = 0.5;

  /** Trunk side-bend of the push-up, degrees, at full effort: the chest raised off the canvas. */
  const PUSH_TRUNK: number = 25;

  /** Neck side-bend of the push-up, degrees, at full effort: the head lifted. */
  const PUSH_NECK: number = 20;

  /** Forward reach of the drawn-up foot, as a share of the thigh: under the hip. */
  const DRAWN_FOOT: number = 0.3;

  /** Height of the drawn knee, as a share of the hip height. */
  const DRAWN_KNEE: number = 0.4;

  /** Share of the fall at which the head has snapped along the kick's travel: a tenth of the fall, about 0.16 s, inside the 0.1 to 0.3 s of the fencing response. */
  const HEAD_DRIVEN: number = 0.1;

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
    // The head snaps along the kick's travel to the right shoulder, turned and
    // thrown back, while both arms stiffen forward and up in the fencing
    // response.
    const fencing = (side: 1 | -1): { point: IAutoMovieVector3 } => ({
      point: {
        x: measure.armReach * FENCING_REACH,
        y: measure.shoulder - guard.drop + measure.headRadius,
        z: side * measure.shoulderHalfWidth,
      },
    });
    const struck: IBoutPosture = {
      ...guard,
      cervical: SNAP,
      thoracic: { ...guard.thoracic, lateralFlexion: -15 },
      hands: { left: fencing(1), right: fencing(-1) },
      wince: 1,
    };
    // Tone is lost: the knees buckle under the hips, the trunk and head fall
    // limp forward and toward the right, the arms hang without a catch.
    const folding: IBoutPosture = {
      ...struck,
      drop: measure.hip * BUCKLE,
      roll: LIMP_ROLL,
      pitch: LIMP_PITCH,
      thoracic: LIMP_TRUNK,
      lumbar: LIMP_LUMBAR,
      cervical: LIMP_NECK,
      hands: {
        left: {
          point: {
            x: measure.headRadius,
            y:
              measure.shoulder -
              measure.hip * BUCKLE -
              measure.armReach * HANGING,
            z: measure.shoulderHalfWidth,
          },
        },
        right: {
          point: {
            x: measure.headRadius,
            y:
              measure.shoulder -
              measure.hip * BUCKLE -
              measure.armReach * HANGING,
            z: -measure.shoulderHalfWidth,
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
    // Rolled onto his right side, the trunk and head reach toward his right
    // and the legs toward his left: the head's top a stature to one side and
    // the feet a leg's length to the other bound the lying body.
    const length: number = measure.head + measure.headRadius;
    return {
      from: {
        x: origin.x - right.x * measure.hip,
        z: origin.z - right.z * measure.hip,
      },
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
    // He rolls toward his front onto the braced forearm, pushes the shoulders
    // up off the canvas through it and draws the top knee up under the hip.
    const top = lyingPosture.feet.left;
    const pushed: IBoutPosture = {
      ...lyingPosture,
      roll: lyingPosture.roll * (1 - PUSH_UNROLL * effort),
      thoracic: {
        ...lyingPosture.thoracic,
        lateralFlexion: PUSH_TRUNK * effort,
      },
      cervical: {
        ...lyingPosture.cervical,
        lateralFlexion: PUSH_NECK * effort,
      },
      hands: {
        ...lyingPosture.hands,
        left: {
          point: {
            x: measure.headRadius * 2,
            y: measure.shoulder - measure.hip * 0.9,
            z: -measure.shoulderHalfWidth * 0.2,
          },
          elbow: {
            x: measure.headRadius * 2,
            y: measure.shoulder - measure.hip * 0.9,
            z: measure.shoulderHalfWidth,
          },
        },
      },
      feet: {
        ...lyingPosture.feet,
        left: {
          point: {
            x: measure.thigh * DRAWN_FOOT,
            y: measure.ankle,
            z: top?.point.z ?? measure.hipHalfWidth,
          },
          knee: {
            x: measure.thigh,
            y: measure.hip * DRAWN_KNEE,
            z: top?.point.z ?? measure.hipHalfWidth,
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
