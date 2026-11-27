import type {
  AutoMovieVector3Tuple,
  IAutoMovieAxisDirection,
} from "@automovie/interface";

import { AutoMovieEngineSolidVector } from "./AutoMovieEngineSolidVector";

/**
 * Scale-safe direction arithmetic for the existing construction axes.
 *
 * Ordinary normal magnitudes retain the original
 * dot/subtract/hypot/reciprocal-multiply order. A subnormal or unrepresentable
 * projected norm instead causes max-component scaling of the input direction
 * before projection. Normalization likewise scales a vector before measuring it
 * when its norm is subnormal or overflows. This preserves direction rather than
 * dividing by a subnormal hypot rounded to one representable step.
 */
export namespace AutoMovieEngineAxisDirection {
  /**
   * Project a direction off an admitted unit tangent, preserving ordinary
   * arithmetic.
   */
  export function project(
    up: AutoMovieVector3Tuple,
    tangent: AutoMovieVector3Tuple,
    targetNorm: number = Math.hypot(...up),
  ): IAutoMovieAxisDirection.IProjection {
    // A component past a quarter of the largest double overflows the
    // projection's difference, so such a direction is scaled before it.
    const magnitude: number = Math.max(...up.map(Math.abs));
    const huge: boolean = magnitude > Number.MAX_VALUE / 4;
    let vector: AutoMovieVector3Tuple = huge
      ? up
      : AutoMovieEngineSolidVector.sub(
          up,
          AutoMovieEngineSolidVector.scale(
            tangent,
            AutoMovieEngineSolidVector.dot(up, tangent),
          ),
        );
    let normalNorm: number = huge ? 0 : Math.hypot(...vector);
    if (huge || normalNorm < MINIMUM_NORMAL) {
      if (magnitude > 0) {
        const scaled: AutoMovieVector3Tuple = up.map(
          (value: number): number => value / magnitude,
        ) as AutoMovieVector3Tuple;
        const scaledVector: AutoMovieVector3Tuple = AutoMovieEngineSolidVector.sub(
          scaled,
          AutoMovieEngineSolidVector.scale(
            tangent,
            AutoMovieEngineSolidVector.dot(scaled, tangent),
          ),
        );
        const scaledNorm: number = Math.hypot(...scaledVector);

        // Scaling an enormous tangent component must not erase a representable raw normal.
        if (scaledNorm > 0 || !(normalNorm > 0)) {
          targetNorm = Math.hypot(...scaled);
          vector = scaledVector;
          normalNorm = scaledNorm;
        }
      }
    }
    return { vector, normalNorm, targetNorm };
  }

  /**
   * A unit direction, preserving zero/invalid inputs for the caller's admission
   * path.
   */
  export function unit(
    vector: AutoMovieVector3Tuple,
    norm: number = Math.hypot(...vector),
  ): AutoMovieVector3Tuple {
    if (!(norm > 0)) return vector;

    // A component past half the largest double overflows the norm, which is
    // then measured on the scaled vector.
    const magnitude: number = Math.max(...vector.map(Math.abs));
    if (norm >= MINIMUM_NORMAL && magnitude <= Number.MAX_VALUE / 2)
      return AutoMovieEngineSolidVector.scale(vector, 1 / norm);
    if (!(magnitude > 0)) return vector;
    const scaled: AutoMovieVector3Tuple = vector.map(
      (value: number): number => value / magnitude,
    ) as AutoMovieVector3Tuple;
    return AutoMovieEngineSolidVector.scale(scaled, 1 / Math.hypot(...scaled));
  }

  /**
   * Reflect an admitted unit direction in a finite Householder normal,
   * retaining the existing ordinary formula.
   */
  export function reflect(
    vector: AutoMovieVector3Tuple,
    direction: AutoMovieVector3Tuple,
    squaredNorm: number = AutoMovieEngineSolidVector.dot(direction, direction),
  ): AutoMovieVector3Tuple {
    // A component past the root of a third of the largest double overflows
    // the squared norm, which then reflects through the unit normal.
    if (
      squaredNorm >= MINIMUM_NORMAL &&
      Math.max(...direction.map(Math.abs)) <= Math.sqrt(Number.MAX_VALUE / 3)
    )
      return AutoMovieEngineSolidVector.sub(
        vector,
        AutoMovieEngineSolidVector.scale(
          direction,
          (2 / squaredNorm) * AutoMovieEngineSolidVector.dot(direction, vector),
        ),
      );
    if (direction.every((value: number): boolean => value === 0)) return vector;
    const normal: AutoMovieVector3Tuple = unit(direction);
    return AutoMovieEngineSolidVector.sub(
      vector,
      AutoMovieEngineSolidVector.scale(
        normal,
        2 * AutoMovieEngineSolidVector.dot(normal, vector),
      ),
    );
  }
}

/*
 * Smallest normal binary64 magnitude; this is a representation boundary, not an
 * axis length or anatomical tolerance.
 */
const MINIMUM_NORMAL: number = 2 ** -1022;
