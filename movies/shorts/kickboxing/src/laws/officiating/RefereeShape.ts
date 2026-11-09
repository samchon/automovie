import { Vector3 } from "@automovie/engine";
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
 * @evidence docs/research/officiating/referee.md#count One downward arm motion per counted second toward the fallen man; the winner's hand raised.
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

  /** Share of each counted second in which the counting arm rises, before its downward motion (referee.md#count: one downward motion per second). */
  const COUNT_RISE: number = 0.3;

  /** How far below the shoulder the counting arm ends, as a share of its reach: pointing down at the man on the canvas. */
  const COUNT_DROP: number = 0.4;

  /** Height of a raised hand above the shoulder, as a share of the arm's reach: the arm nearly upright. */
  const RAISE_HEIGHT: number = 0.85;

  /** Forward reach of a raised hand toward its subject, as a share of the arm's reach. */
  const RAISE_REACH: number = 0.3;

  /** Shares of the attend crouch between which his hand is raised for the doctor: its middle two fifths. */
  const DOCTOR_CALL: readonly [number, number] = [0.3, 0.7];

  /** Share of a raise over which the arm goes up, and again comes down: a tenth, a quick lift that then holds. */
  const RAISE_SHARE: number = 0.1;

  /** How far in front of the shoulders the wave-off's hands cross, as a share of the reach: just ahead of the head so the crossing reads from the side. */
  const WAVE_FORWARD: number = 0.2;

  /** Crossings of the arms over the head in the knockout wave-off: crossed and opened twice (WAKO and GLORY practice). */
  const WAVES: number = 2;

  /** Knee flexion of the crouch beside B, degrees: "shallow supported crouch", read as a quarter of the knee range. */
  const CROUCH_KNEES: number = 35;

  /** Trunk flexion of the crouch over the fallen man, degrees: leaning over him, a third of the thoracic range. */
  const CROUCH_TRUNK: number = 25;

  /** Neck flexion of the crouch, degrees: looking down at him. */
  const CROUCH_NECK: number = 20;

  /** Low point of the fight signal's hand, as a share of the arm's reach behind the shoulder at the end of its sweep. */
  const SWEEP_BACK: number = 0.2;

  /** How far out to his side a raised or swept hand goes, in shoulder half-widths: clear of his own head and body so it reads from the front and the side. */
  const OUT_TO_SIDE: number = 1.5;

  /** Shares of the fight signal between which the low hand sweeps up and back: held low first, then swept, then held up. */
  const SWEEP: readonly [number, number] = [0.4, 0.8];

  /**
   * How far a raised arm is up over a raise's progress: up quickly from its
   * start, held, lowered at its end.
   *
   * @param progress Progress of the raise; below 0 before it starts.
   * @returns Raise in [0, 1].
   */
  export function raise(progress: number): number {
    return Math.max(
      0,
      Math.min(1, progress / RAISE_SHARE, (1 - progress) / RAISE_SHARE),
    );
  }

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
        // The hand held low and extended between the fighters, then swept up
        // and back out of the line as he steps out.
        const low: IAutoMovieVector3 = out(-1, -reach * COUNT_DROP).point;
        const high: IAutoMovieVector3 = {
          x: -reach * SWEEP_BACK,
          y: shoulder + reach * RAISE_HEIGHT,
          z: -measure.shoulderHalfWidth * OUT_TO_SIDE,
        };
        const sweep: number = Math.max(
          0,
          Math.min(1, (s - SWEEP[0]) / (SWEEP[1] - SWEEP[0])),
        );
        signal = {
          ...base,
          hands: {
            ...base.hands,
            right: { point: Vector3.lerp(low, high, sweep) },
          },
        };
        break;
      }
      case "down":
        // The arm points down at the man on the canvas, fully extended.
        signal = {
          ...base,
          hands: { ...base.hands, right: out(-1, -reach * COUNT_DROP) },
        };
        break;
      case "neutral-corner":
        // The arm points at the far neutral corner at shoulder height.
        signal = { ...base, hands: { ...base.hands, right: out(-1, 0) } };
        break;
      case "winner": {
        // He walks to the winner first, then holds his wrist and raises it
        // straight up: his arm goes up toward the winner, the hand above his
        // own head (referee.md#count).
        const raised: IBoutPosture = {
          ...base,
          hands: {
            ...base.hands,
            right: {
              point: {
                x: toward.x * reach * RAISE_REACH,
                y: shoulder + reach * RAISE_HEIGHT,
                z: -measure.shoulderHalfWidth + toward.z * reach * RAISE_REACH,
              },
            },
          },
        };
        return blendPosture(base, raised, raise(s), rest);
      }
      case "count": {
        // One downward motion of the arm per number, toward the fallen man:
        // up beside the head in the first part of the second, then down
        // pointing at him (referee.md#count).
        const lift: number = Math.min(1, s / COUNT_RISE);
        const fall: number =
          s <= COUNT_RISE ? 0 : (s - COUNT_RISE) / (1 - COUNT_RISE);
        const up: IAutoMovieVector3 = {
          x: toward.x * reach * 0.3,
          y: shoulder + reach * RAISE_HEIGHT,
          z: -measure.shoulderHalfWidth + toward.z * reach * 0.3,
        };
        const down: IAutoMovieVector3 = out(-1, -reach * COUNT_DROP).point;
        const rest: IAutoMovieVector3 = base.hands.right.point;
        const at: IAutoMovieVector3 =
          fall === 0
            ? Vector3.lerp(rest, up, lift)
            : Vector3.lerp(up, down, fall);
        signal = { ...base, hands: { ...base.hands, right: { point: at } } };
        break;
      }
      case "knockout": {
        // Both arms over the head, crossing and opening twice: the wave-off.
        const cross: number = Math.cos(2 * Math.PI * WAVES * s);
        const over = (side: 1 | -1): { point: IAutoMovieVector3 } => ({
          point: {
            x: reach * WAVE_FORWARD,
            y: shoulder + reach * RAISE_HEIGHT,
            z: side * measure.shoulderHalfWidth * 2 * cross,
          },
        });
        signal = { ...base, hands: { left: over(1), right: over(-1) } };
        break;
      }
      case "attend": {
        // Crouched over the fallen man, he raises one hand high to call the
        // doctor through the middle of the crouch, then lowers it.
        const drop: number = StanceShape.drop(measure, CROUCH_KNEES);
        const crouch: IBoutPosture = {
          ...base,
          drop,
          thoracic: { ...base.thoracic, flexion: CROUCH_TRUNK },
          cervical: { ...base.cervical, flexion: CROUCH_NECK },
        };
        const calling: IBoutPosture = {
          ...crouch,
          hands: {
            ...crouch.hands,
            right: {
              point: {
                x: 0,
                y: measure.shoulder - drop + reach * RAISE_HEIGHT,
                z: -measure.shoulderHalfWidth * OUT_TO_SIDE,
              },
            },
          },
        };
        const call: number = raise(
          (s - DOCTOR_CALL[0]) / (DOCTOR_CALL[1] - DOCTOR_CALL[0]),
        );
        return blendPosture(
          base,
          blendPosture(crouch, calling, call, rest),
          Math.min(1, s * 3),
          rest,
        );
      }
    }
    return blendPosture(base, signal, envelope, rest);
  }
}
