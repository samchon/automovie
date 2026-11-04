import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * Where on the head each part of a style's direction field acts: smoothstep
 * weights of a root's chart direction (`+X` forward, `+Y` up). `upper` is
 * the top of the head (0 under 0.35 of the radius over the horizon, 1 over
 * 0.7), `front` the face side (0 to 1 between 0.25 and 0.6 forward) and
 * `back` the back of the head (1 behind 0.5, 0 ahead of 0.1 behind). The
 * thresholds are conventions of this prototype, chosen so a style's top
 * combing meets its falling sides over a band about a fifth of the chart's
 * radius wide.
 */
export namespace AutoMovieHumanHairFlowWeights {
  /**
   * The top of the head.
   *
   * @param u Unit chart direction
   * @returns Weight in [0, 1]
   */
  export function upper(u: AutoMovieHumanSkinVector.Vec3): number {
    return AutoMovieHumanAppearanceNoise.smoothstep(0.35, 0.7, u[1]);
  }

  /**
   * The face side, temples included.
   *
   * @param u Unit chart direction
   * @returns Weight in [0, 1]
   */
  export function front(u: AutoMovieHumanSkinVector.Vec3): number {
    return AutoMovieHumanAppearanceNoise.smoothstep(0.25, 0.6, u[0]);
  }

  /**
   * The back of the head.
   *
   * @param u Unit chart direction
   * @returns Weight in [0, 1]
   */
  export function back(u: AutoMovieHumanSkinVector.Vec3): number {
    return AutoMovieHumanAppearanceNoise.smoothstep(-0.1, -0.5, u[0]);
  }
}
