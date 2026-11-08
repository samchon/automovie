import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBoutPosture } from "./IBoutPosture";
import type { KickboxingTechnique } from "./KickboxingTechnique";
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
    const point: IAutoMovieVector3 = bezier(start, control, end, out);
    // Rear-side punches carry the stance turn through the trunk; lead hooks
    // turn it back and lead straights a third of that (IBA pages 42-45,
    // techniques section 3); positive rotation turns the front left.
    const drive: number =
      (spec.side === "right" ? 1 : spec.line === "arc" ? -1 : -1 / 3) *
      toDegrees(StanceShape.TURN) *
      out;
    const body: number = spec.level === "body" ? measure.headRadius * out : 0;
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
}
