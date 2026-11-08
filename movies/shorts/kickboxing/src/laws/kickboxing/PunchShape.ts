import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBoutPosture } from "./IBoutPosture";
import type { KickboxingTechnique } from "./KickboxingTechnique";
import { KickboxingTiming } from "./KickboxingTiming";
import { StanceShape } from "./StanceShape";
import { StrikeShape } from "./StrikeShape";

/**
 * The punch's shape prior in the attacker's root frame: the glove travels
 * from the guard along the technique's straight, arc or rising line to a
 * glove radius short of the target, less the landing depth, while the trunk
 * carries the stance turn into it and a body punch lowers the stance.
 *
 * ```ts
 * PunchShape.posture({ measure, guard, target }, KickboxingTechnique.table.cross, 0.7);
 * ```
 *
 * @evidence docs/research/kickboxing/techniques.md#surfaces Lines, surfaces and receiver regions.
 * @evidence docs/research/kickboxing/techniques.md Section 3: rear punches carry the stance turn through the trunk.
 */
export namespace PunchShape {
  /**
   * Peak speed of the fist, the glove's end point, in the extension, metres
   * per second: the single maximal cross's mean contact speed, 8.22 ± 1.08
   * m/s (Piorkowski, Lees and Barton 2011), whose straight punches' peak
   * end-point speeds spread from about 7.5 to 15 m/s, inside the 7.3-12 m/s
   * of the measured crosses and lead hooks (Frontiers in Sports and Active
   * Living 2024).
   */
  export const PEAK_SPEED: number = 8.22;

  /** Peak over mean speed of a smoothstep: its slope at the half. */
  const EASE_PEAK: number = 1.5;

  /** Share of the punch shown during its startup, before the extension: the shoulder and hip turn that begin before the fist leaves (film reading). */
  export const LOAD: number = 0.15;

  /**
   * Seconds of a punch's extension, the fist's fast travel into contact: the
   * path left after the startup's {@link LOAD}, covered by a smoothstep that
   * peaks at {@link PEAK_SPEED}, never longer than the delivery.
   *
   * @param delivery Launch to contact, seconds.
   * @param path Length of the fist's path from the guard to contact, metres.
   * @returns Seconds.
   * @evidence docs/research/kickboxing/techniques.md#punch-timing Peak fist speed of the measured punches.
   */
  export function extension(delivery: number, path: number): number {
    return Math.min(delivery, (EASE_PEAK * (1 - LOAD) * path) / PEAK_SPEED);
  }

  /**
   * A punch's extension at an instant: the startup loads the shoulder and
   * hips while the entry lands, the fist extends at its peak speed over the
   * last {@link extension} seconds to contact, and returns over the hand's
   * recovery.
   *
   * @param seconds Seconds since the launch.
   * @param delivery Launch to contact, seconds.
   * @param path Length of the fist's path from the guard to contact, metres.
   * @returns Extension in [0, 1].
   * @evidence docs/research/kickboxing/techniques.md#punch-timing Delivery, peak fist speed and recovery.
   */
  export function amount(
    seconds: number,
    delivery: number,
    path: number,
  ): number {
    const extension: number = PunchShape.extension(delivery, path);
    const load: number = delivery - extension;
    if (seconds <= load) return load > 0 ? LOAD * ease(seconds / load) : 0;
    if (seconds <= delivery)
      return LOAD + (1 - LOAD) * ease((seconds - load) / extension);
    return Math.max(
      0,
      1 - ease((seconds - delivery) / KickboxingTiming.HAND_RECOVERY),
    );
  }

  /**
   * A punch at extension `out` in [0, 1].
   *
   * @param input The strike's measure, guard and target (null for a feint's path).
   * @param spec The punch performed.
   * @param out Extension along the path, from the guard (0) to the target (1).
   * @returns The posture.
   * @evidence docs/research/kickboxing/techniques.md#surfaces Straight, arc and rising lines onto the region.
   */
  export function posture(
    input: Pick<StrikeShape.IInput, "measure" | "guard" | "target">,
    spec: KickboxingTechnique.ISpec,
    out: number,
  ): IBoutPosture {
    const { measure, guard } = input;
    const side: "left" | "right" = spec.side;
    const point: IAutoMovieVector3 = line(input, spec)(out);
    // Rear-side punches carry the stance turn through the trunk; lead hooks
    // turn it back and lead straights a third of that (IBA pages 42-45,
    // techniques section 3); positive rotation turns the front left.
    const drive: number =
      (spec.side === "right" ? 1 : spec.line === "arc" ? -1 : -1 / 3) *
      toDegrees(StanceShape.TURN) *
      out;
    const body: number = spec.level === "body" ? measure.headRadius * out : 0;
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const shoulder: IAutoMovieVector3 = {
      x: 0,
      y: measure.shoulder - guard.drop,
      z: sign * measure.shoulderHalfWidth,
    };
    return {
      ...guard,
      drop: guard.drop + body,
      thoracic: {
        ...guard.thoracic,
        rotation: guard.thoracic.rotation + drive,
      },
      pelvis: { ...guard.pelvis, rotation: guard.pelvis.rotation + drive / 2 },
      hands: {
        ...guard.hands,
        [side]: {
          point,
          ...(spec.line === "arc"
            ? {
                elbow: Vector3.add(shoulder, {
                  x: 0,
                  y: 0,
                  z: sign * measure.shoulderHalfWidth,
                }),
              }
            : {}),
        },
      },
    };
  }

  /** Segments the fist's path length is summed over. */
  const PATH_SEGMENTS: number = 16;

  /**
   * Length of a punch's fist path from the guard to contact.
   *
   * @param input The strike's measure, guard and target (null for a feint's path).
   * @param spec The punch performed.
   * @returns Metres.
   */
  export function path(
    input: Pick<StrikeShape.IInput, "measure" | "guard" | "target">,
    spec: KickboxingTechnique.ISpec,
  ): number {
    const along = line(input, spec);
    let length: number = 0;
    for (let k: number = 1; k <= PATH_SEGMENTS; k++)
      length += Vector3.length(
        Vector3.subtract(
          along(k / PATH_SEGMENTS),
          along((k - 1) / PATH_SEGMENTS),
        ),
      );
    return length;
  }

  /** The fist's straight, arc or rising line from the guard to contact, by extension in [0, 1]. */
  function line(
    input: Pick<StrikeShape.IInput, "measure" | "guard" | "target">,
    spec: KickboxingTechnique.ISpec,
  ): (out: number) => IAutoMovieVector3 {
    const { measure, guard } = input;
    const side: "left" | "right" = spec.side;
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const start: IAutoMovieVector3 = guard.hands[side].point;
    const shoulder: IAutoMovieVector3 = {
      x: 0,
      y: measure.shoulder - guard.drop,
      z: sign * measure.shoulderHalfWidth,
    };
    const aim: IAutoMovieVector3 =
      input.target ??
      Vector3.add(shoulder, { x: measure.armReach, y: 0, z: 0 });
    const direction: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(aim, shoulder),
    );
    // The glove centre stops a glove radius short of the target minus the landing depth.
    const end: IAutoMovieVector3 = Vector3.subtract(
      aim,
      Vector3.scale(direction, measure.gloveRadius - StrikeShape.LANDING_DEPTH),
    );
    const control: IAutoMovieVector3 =
      spec.line === "arc"
        ? Vector3.add(Vector3.lerp(start, end, 0.5), {
            x: 0,
            y: 0,
            z: sign * measure.shoulderHalfWidth * 2,
          })
        : spec.line === "rising"
          ? Vector3.add(Vector3.lerp(start, end, 0.5), {
              x: 0,
              y: -measure.headRadius * 2,
              z: 0,
            })
          : Vector3.lerp(start, end, 0.5);
    return (out: number): IAutoMovieVector3 => bezier(start, control, end, out);
  }

  /** Quadratic Bezier. */
  function bezier(
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    c: IAutoMovieVector3,
    t: number,
  ): IAutoMovieVector3 {
    return Vector3.lerp(Vector3.lerp(a, b, t), Vector3.lerp(b, c, t), t);
  }

  function toDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
  }

  /** Smoothstep easing of a progress in [0, 1]. */
  function ease(t: number): number {
    const x: number = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  }
}
