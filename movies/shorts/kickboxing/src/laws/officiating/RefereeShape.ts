import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBoutPosture } from "../kickboxing/IBoutPosture";
import type { IFighterMeasure } from "../kickboxing/IFighterMeasure";
import { StanceShape } from "../kickboxing/StanceShape";
import { blendPosture } from "../kickboxing/blendPosture";

/**
 * The referee's shapes in his own root frame: the officiating stance with
 * soft knees and both hands ready in front of the waist, and the signals of
 * the manual, each a gesture that rises, holds and returns.
 *
 * ```ts
 * RefereeShape.posture(measure, { signal: "count", share: 0.4, toward });
 * ```
 *
 * @evidence docs/research/officiating/referee.md#signals Soft knees, hands ready; "Fight!" palm rising and sweeping down; pointing for "Down!" and the neutral corner; counting fingers; both hands sweeping across to end the contest.
 * @evidence docs/body/settings/cast/referee.md#signals The film's signals.
 * @evidence docs/body/settings/cast/referee.md#after-result The shallow supported crouch beside B.
 */
export namespace RefereeShape {
  /** A signal of the manual, or the crouch beside the fallen fighter. */
  export type Signal =
    | "fight"
    | "down"
    | "neutral-corner"
    | "count"
    | "knockout"
    | "winner"
    | "attend";

  /** Knee flexion of the officiating stance, degrees: "soft knees", read as half the fighters' stance bend. */
  const SOFT_KNEES: number = StanceShape.KNEE_FLEXION / 2;

  /** Knee flexion of the crouch beside B, degrees: "shallow supported crouch", read as a quarter of the knee range. */
  const CROUCH_KNEES: number = 35;

  /**
   * The officiating stance.
   *
   * @param measure The referee's measure.
   * @returns The posture.
   * @evidence docs/research/officiating/referee.md#signals Soft knees and hands ready in front of the waist.
   */
  export function stance(measure: IFighterMeasure): IBoutPosture {
    const drop: number = StanceShape.drop(measure, SOFT_KNEES);
    const waist: number =
      measure.hip - drop + (measure.shoulder - measure.hip) * 0.3;
    const ready = (side: 1 | -1): { point: IAutoMovieVector3 } => ({
      point: {
        x: measure.headRadius * 2,
        y: waist,
        z: side * measure.hipHalfWidth,
      },
    });
    return {
      drop,
      shift: { forward: 0, left: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      pelvis: { tilt: 0, obliquity: 0, rotation: 0 },
      thoracic: { flexion: 5, lateralFlexion: 0, rotation: 0 },
      lumbar: { flexion: 0, lateralFlexion: 0 },
      cervical: { flexion: 0, lateralFlexion: 0, rotation: 0 },
      hands: { left: ready(1), right: ready(-1) },
      feet: { left: null, right: null },
      pivot: 0,
      jaw: 0,
      wince: 0,
    };
  }

  /**
   * The referee's posture during a signal.
   *
   * @param measure His measure.
   * @param rest Body-frame foot points.
   * @param input The signal, its progress in [0, 1] and, for pointing, the body-frame direction to point along.
   * @returns The posture.
   * @evidence docs/research/officiating/referee.md#signals Each signal's gesture.
   */
  export function posture(
    measure: IFighterMeasure,
    rest: Record<"left" | "right", IAutoMovieVector3>,
    input: { signal: Signal; share: number; toward?: IAutoMovieVector3 },
  ): IBoutPosture {
    const base: IBoutPosture = stance(measure);
    const s: number = Math.max(0, Math.min(1, input.share));
    const envelope: number = Math.min(1, s * 4, (1 - s) * 4);
    const shoulder: number = measure.shoulder - base.drop;
    const reach: number = measure.armReach;
    const toward: IAutoMovieVector3 = input.toward ?? { x: 1, y: 0, z: 0 };
    const out = (
      side: 1 | -1,
      height: number,
    ): { point: IAutoMovieVector3 } => ({
      point: {
        x: toward.x * reach * 0.9,
        y: shoulder + height,
        z: side * measure.shoulderHalfWidth + toward.z * reach * 0.9,
      },
    });
    let signal: IBoutPosture;
    switch (input.signal) {
      case "fight": {
        // The palm rises beside the shoulder, then sweeps down between them.
        const up: number = s < 0.5 ? s * 2 : 1 - (s - 0.5) * 2;
        signal = {
          ...base,
          hands: {
            ...base.hands,
            right: {
              point: {
                x: reach * 0.4,
                y: shoulder + up * measure.headRadius * 2,
                z: -measure.shoulderHalfWidth,
              },
            },
          },
        };
        break;
      }
      case "down":
      case "neutral-corner":
      case "winner":
        signal = { ...base, hands: { ...base.hands, right: out(-1, 0) } };
        break;
      case "count": {
        // One downward beat of the counting hand per number.
        const beat: number = Math.sin(Math.PI * s);
        signal = {
          ...base,
          hands: {
            ...base.hands,
            right: {
              point: {
                x: reach * 0.7,
                y: shoulder + measure.headRadius * beat,
                z: -measure.shoulderHalfWidth * 0.5,
              },
            },
          },
        };
        break;
      }
      case "knockout": {
        const cross: number = s < 0.5 ? s * 2 : 1;
        signal = {
          ...base,
          hands: {
            left: {
              point: {
                x: reach * 0.5,
                y: shoulder - measure.headRadius,
                z: measure.shoulderHalfWidth * (2 - 3 * cross),
              },
            },
            right: {
              point: {
                x: reach * 0.5,
                y: shoulder - measure.headRadius,
                z: -measure.shoulderHalfWidth * (2 - 3 * cross),
              },
            },
          },
        };
        break;
      }
      case "attend": {
        const drop: number = StanceShape.drop(measure, CROUCH_KNEES);
        return blendPosture(
          base,
          {
            ...base,
            drop,
            thoracic: { ...base.thoracic, flexion: 25 },
            cervical: { ...base.cervical, flexion: 20 },
          },
          Math.min(1, s * 3),
          rest,
        );
      }
    }
    return blendPosture(base, signal, envelope, rest);
  }
}
