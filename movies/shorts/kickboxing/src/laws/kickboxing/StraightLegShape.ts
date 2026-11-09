import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBoutPosture } from "./IBoutPosture";
import type { IFighterMeasure } from "./IFighterMeasure";
import type { KickboxingTechnique } from "./KickboxingTechnique";
import { StrikeShape } from "./StrikeShape";
import { blendPosture } from "./blendPosture";

/**
 * Shape priors of the leg strikes that drive straight from the chamber, in
 * the attacker's own root frame: the lead teep and the clinch knee, and the
 * folded chamber every kick rises through. The round kicks stay with
 * {@link StrikeShape}, which dispatches here.
 *
 * ```ts
 * StraightLegShape.teep(input, "out", 0.5, 1);
 * ```
 *
 * @evidence docs/research/kickboxing/techniques.md#kick-timing Chamber, impact and recoil of kicks.
 * @evidence docs/research/kickboxing/techniques.md#surfaces The sole and the knee meet the stomach.
 */
export namespace StraightLegShape {
  /** Hip flexion of the round-kick chamber, degrees, by level: thigh toward the target height (PLOS Fig. 3 chamber). */
  export const CHAMBER_HIP: Readonly<
    Record<KickboxingTechnique.Level, number>
  > = {
    leg: 45,
    body: 80,
    head: 95,
  };

  /** Knee flexion of the chamber, degrees: the folded shank of PLOS Fig. 3 B. */
  export const CHAMBER_KNEE: number = 110;

  /**
   * The lead-leg teep: knee up, sole driven forward to the stomach, recoil.
   *
   * @param input The strike and the instant.
   * @param phase Out to the impact or back to the replant.
   * @param progress Progress through the phase in [0, 1].
   * @param amount Share of the full shape shown.
   * @returns The posture.
   */
  export function teep(
    input: StrikeShape.IInput,
    phase: "out" | "back",
    progress: number,
    amount: number,
  ): IBoutPosture {
    const { measure, guard, rest } = input;
    const hip: IAutoMovieVector3 = {
      x: 0,
      y: measure.hip - guard.drop,
      z: measure.hipHalfWidth,
    };
    const chamber = fold(hip, CHAMBER_HIP.body, 1, measure);
    const aim: IAutoMovieVector3 =
      input.target ??
      Vector3.add(hip, { x: measure.thigh + measure.shank, y: 0, z: 0 });
    const end: IAutoMovieVector3 = Vector3.subtract(aim, {
      x: measure.foot / 2 - StrikeShape.LANDING_DEPTH,
      y: 0,
      z: 0,
    });
    const out: number = phase === "out" ? ease(progress) : 1 - ease(progress);
    const point: IAutoMovieVector3 =
      phase === "out" && progress < 0.6
        ? Vector3.lerp(rest.left, chamber.point, ease(progress / 0.6))
        : phase === "out"
          ? Vector3.lerp(chamber.point, end, ease((progress - 0.6) / 0.4))
          : progress < 0.5
            ? Vector3.lerp(end, chamber.point, ease(progress / 0.5))
            : Vector3.lerp(
                chamber.point,
                rest.left,
                ease((progress - 0.5) / 0.5),
              );
    const kicked: IBoutPosture = {
      ...guard,
      shift: { forward: -measure.headRadius * out, left: 0 },
      thoracic: {
        ...guard.thoracic,
        flexion: guard.thoracic.flexion - 10 * out,
      },
      feet: { ...guard.feet, left: { point } },
    };
    return blendPosture(guard, kicked, amount, rest);
  }

  /**
   * The clinch knee: both gloves behind the receiver's head, the rear knee driven up into his stomach.
   *
   * @param input The strike and the instant.
   * @param phase Out to the impact or back to the replant.
   * @param progress Progress through the phase in [0, 1].
   * @param amount Share of the full shape shown.
   * @returns The posture.
   */
  export function knee(
    input: StrikeShape.IInput,
    phase: "out" | "back",
    progress: number,
    amount: number,
  ): IBoutPosture {
    const { measure, guard, rest } = input;
    const hip: IAutoMovieVector3 = {
      x: 0,
      y: measure.hip - guard.drop,
      z: -measure.hipHalfWidth,
    };
    const target: IAutoMovieVector3 =
      input.target ?? Vector3.add(hip, { x: measure.thigh, y: 0, z: 0 });
    const kneePoint: IAutoMovieVector3 = Vector3.subtract(target, {
      x: StrikeShape.LANDING_DEPTH,
      y: 0,
      z: 0,
    });
    const ankle: IAutoMovieVector3 = Vector3.add(kneePoint, {
      x: -measure.shank * 0.6,
      y: -measure.shank * 0.8,
      z: 0,
    });
    const out: number = phase === "out" ? ease(progress) : 1 - ease(progress);
    const grip: IAutoMovieVector3 = input.clinch ?? guard.hands.left.point;
    const kneed: IBoutPosture = {
      ...guard,
      thoracic: { ...guard.thoracic, flexion: guard.thoracic.flexion + 10 },
      hands: {
        left: {
          point: Vector3.add(grip, { x: 0, y: 0, z: measure.gloveRadius }),
        },
        right: {
          point: Vector3.add(grip, { x: 0, y: 0, z: -measure.gloveRadius }),
        },
      },
      feet: {
        ...guard.feet,
        right: { point: Vector3.lerp(rest.right, ankle, out), knee: kneePoint },
      },
    };
    return blendPosture(guard, kneed, amount * Math.min(1, out * 2), rest);
  }

  /**
   * The folded chamber of a leg at a hip flexion, raised beside the hip toward the front.
   *
   * @param hip The hip joint, root frame.
   * @param flexion Hip flexion, degrees.
   * @param sign +1 to open the thigh toward the left, -1 toward the right.
   * @param measure The fighter's measure.
   * @returns The ankle point and the knee.
   */
  export function fold(
    hip: IAutoMovieVector3,
    flexion: number,
    sign: 1 | -1,
    measure: IFighterMeasure,
  ): { point: IAutoMovieVector3; knee: IAutoMovieVector3 } {
    const f: number = (flexion * Math.PI) / 180;
    const thigh: IAutoMovieVector3 = {
      x: Math.sin(f),
      y: -Math.cos(f),
      z: sign * 0.25,
    };
    const knee: IAutoMovieVector3 = Vector3.add(
      hip,
      Vector3.scale(Vector3.normalize(thigh), measure.thigh),
    );
    const k: number = f + Math.PI - (CHAMBER_KNEE * Math.PI) / 180;
    const shank: IAutoMovieVector3 = {
      x: -Math.sin(Math.PI - k) * 0.6,
      y: -Math.cos(Math.PI - k),
      z: 0,
    };
    return {
      knee,
      point: Vector3.add(
        knee,
        Vector3.scale(Vector3.normalize(shank), measure.shank),
      ),
    };
  }

  /** Smoothstep easing of a progress in [0, 1]. */
  function ease(t: number): number {
    const x: number = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  }
}
