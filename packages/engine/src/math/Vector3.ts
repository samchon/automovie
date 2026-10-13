import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Pure-function vector math over {@link IAutoMovieVector3} (`{ x, y, z }`).
 *
 * Stateless helpers: every operation returns a fresh object and never mutates
 * its inputs. The engine keeps its own tiny math layer (rather than depending
 * on `three.js`) so it stays renderer-agnostic and runnable headless.
 *
 * @author Samchon
 */
export namespace Vector3 {
  /** Create a vector from its three components. */
  export const create = (x = 0, y = 0, z = 0): IAutoMovieVector3 => ({
    x,
    y,
    z,
  });

  /** Add two vectors component by component. */
  export const add = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  });

  /** Subtract `b` from `a` component by component. */
  export const subtract = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

  /** Multiply every vector component by a scalar. */
  export const scale = (
    a: IAutoMovieVector3,
    s: number,
  ): IAutoMovieVector3 => ({
    x: a.x * s,
    y: a.y * s,
    z: a.z * s,
  });

  /** Dot product of two vectors. */
  export const dot = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    a.x * b.x + a.y * b.y + a.z * b.z;

  /** Right-handed cross product of two vectors. */
  export const cross = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  });

  /**
   * Euclidean vector magnitude.
   * Ordinary components retain the established dot/square-root arithmetic.
   * Extreme finite components use hypot so a representable magnitude does not
   * overflow or underflow merely because its square is unrepresentable.
   */
  export const length = (a: IAutoMovieVector3): number =>
    normalizationScale(a) === 0
      ? Math.sqrt(dot(a, a))
      : Math.hypot(a.x, a.y, a.z);

  /**
   * Return a unit-length copy, or the zero vector for zero length.
   * Extreme finite vectors are reduced before measuring and dividing, allowing
   * even subnormal components and an overflowing total magnitude to retain
   * their direction. Ordinary vectors preserve their existing arithmetic.
   */
  export const normalize = (a: IAutoMovieVector3): IAutoMovieVector3 => {
    const divisor = normalizationScale(a);
    const value =
      divisor === 0
        ? a
        : { x: a.x / divisor, y: a.y / divisor, z: a.z / divisor };
    const len = length(value);
    return len === 0 ? create(0, 0, 0) : scale(value, 1 / len);
  };

  /**
   * Select a scale only outside the safe squared-component range. At magnitude
   * 2^-511 the largest component's square is normal; three squares of 2^511 still
   * fit Float64. These are arithmetic thresholds, not restrictions on vector
   * input. Returning zero keeps ordinary, zero and nonfinite legacy paths.
   */
  const normalizationScale = (a: IAutoMovieVector3): number => {
    const largest = Math.max(Math.abs(a.x), Math.abs(a.y), Math.abs(a.z));
    return Number.isFinite(largest) &&
      largest > 0 &&
      (largest < 2 ** -511 || largest > 2 ** 511)
      ? largest
      : 0;
  };

  /** Component-wise linear interpolation, `t` in `[0, 1]`. */
  export const lerp = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    t: number,
  ): IAutoMovieVector3 => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  });
}
