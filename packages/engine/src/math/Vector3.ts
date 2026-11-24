import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Pure vector math over {@link IAutoMovieVector3} (`{ x, y, z }`).
 *
 * Operations return fresh values unless their name explicitly ends in Into;
 * those write only the supplied target after reading every source component.
 * The engine keeps this small math layer independent of the renderer so it runs
 * headless without depending on `three.js`.
 */
export namespace Vector3 {
  /** A new vector from its components, each zero when omitted. */
  export const create: (
    x?: number,
    y?: number,
    z?: number,
  ) => IAutoMovieVector3 = (
    x: number = 0,
    y: number = 0,
    z: number = 0,
  ): IAutoMovieVector3 => ({
    x,
    y,
    z,
  });

  /** The component-wise sum `a + b`. */
  export const add: (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ) => IAutoMovieVector3 = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  });

  /** The component-wise difference `a - b`, the vector from `b` to `a`. */
  export const subtract: (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ) => IAutoMovieVector3 = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

  /** Every component of `a` multiplied by the scalar `s`. */
  export const scale: (a: IAutoMovieVector3, s: number) => IAutoMovieVector3 = (
    a: IAutoMovieVector3,
    s: number,
  ): IAutoMovieVector3 => ({
    x: a.x * s,
    y: a.y * s,
    z: a.z * s,
  });

  /**
   * Return a fresh point a + b*s, with scale(b,s) evaluated before adding a.
   * All three products precede the X/Y/Z additions, preserving the original
   * add(a,scale(b,s)) input-read and rounding order without its offset record.
   *
   * @param a Base point in the caller's coordinate frame.
   * @param b Direction or offset in the same frame.
   * @param s Scalar giving b compatible offset units; ray callers use metres.
   * @returns A fresh point with the original signed-zero/nonfinite arithmetic.
   */
  export function addScaled(
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    s: number,
  ): IAutoMovieVector3 {
    const offsetX: number = b.x * s;
    const offsetY: number = b.y * s;
    const offsetZ: number = b.z * s;
    return { x: a.x + offsetX, y: a.y + offsetY, z: a.z + offsetZ };
  }

  /** The dot product `a · b`, which is `|a| |b| cos θ`. */
  export const dot: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): number => a.x * b.x + a.y * b.y + a.z * b.z;

  /**
   * The right-handed cross product `a × b`, perpendicular to both with length
   * `|a| |b| sin θ`, so `cross(X, Y)` is `Z`.
   */
  export const cross: (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ) => IAutoMovieVector3 = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  });

  /**
   * Write `(a - origin) × (b - origin)` into a caller-owned target. The two
   * differences and right-handed cross product retain subtract/cross
   * arithmetic, including nonfinite values and signed zeros. Every source is
   * read before any write, so target may alias origin, a or b.
   *
   * @param target Mutable output; its previous components are not read.
   * @param origin Common edge origin in the same frame and unit as a and b.
   * @param a First edge endpoint, read before the second endpoint.
   * @param b Second edge endpoint; reversing endpoints reverses orientation.
   */
  export const crossDifferenceInto = (
    target: IAutoMovieVector3,
    origin: IAutoMovieVector3,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): void => {
    const ax: number = a.x - origin.x;
    const ay: number = a.y - origin.y;
    const az: number = a.z - origin.z;
    const bx: number = b.x - origin.x;
    const by: number = b.y - origin.y;
    const bz: number = b.z - origin.z;
    const x: number = ay * bz - az * by;
    const y: number = az * bx - ax * bz;
    const z: number = ax * by - ay * bx;
    target.x = x;
    target.y = y;
    target.z = z;
  };

  /**
   * The Euclidean length of `a`.
   *
   * Components whose squares stay in the normal binary64 range use
   * `Math.sqrt(dot(a, a))`, so the result equals that expression exactly. When
   * the largest component is below `2^-511` or above `2^511`, squaring would
   * underflow or overflow, and `Math.hypot` measures it instead, so any
   * representable length is returned. A non-finite component gives a non-finite
   * length.
   */
  export const length: (a: IAutoMovieVector3) => number = (
    a: IAutoMovieVector3,
  ): number =>
    normalizationScale(a) === 0
      ? Math.sqrt(dot(a, a))
      : Math.hypot(a.x, a.y, a.z);

  /**
   * Euclidean distance between two points in the same frame and unit. It equals
   * length(subtract(a, b)) with the same ordinary arithmetic, extreme-magnitude
   * branch and nonfinite propagation, without a vector.
   *
   * @param a The first point, read before b on each X/Y/Z subtraction.
   * @param b The second point in the same frame and unit.
   * @returns Their scalar separation in that unit, including the original
   *   nonfinite result.
   */
  export function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    const x: number = a.x - b.x;
    const y: number = a.y - b.y;
    const z: number = a.z - b.z;
    const squared: number = x * x + y * y + z * z;
    if (squared >= 2 ** -1000 && squared <= 2 ** 1000)
      return Math.sqrt(squared);
    const largest: number = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
    return extremeScale(largest) === 0
      ? Math.sqrt(squared)
      : Math.hypot(x, y, z);
  }

  /**
   * A unit-length vector in the direction of `a`, or the zero vector when `a`
   * has length zero.
   *
   * A vector whose largest component is below `2^-511` or above `2^511` is
   * first divided by that component, so even subnormal components or a length
   * that would overflow keep their direction. A non-finite component gives a
   * non-finite result.
   */
  export const normalize: (a: IAutoMovieVector3) => IAutoMovieVector3 = (
    a: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const divisor: number = normalizationScale(a);
    const value: IAutoMovieVector3 =
      divisor === 0
        ? a
        : { x: a.x / divisor, y: a.y / divisor, z: a.z / divisor };
    const len: number = length(value);
    return len === 0 ? create(0, 0, 0) : scale(value, 1 / len);
  };

  /**
   * The largest component magnitude when it lies outside `[2^-511, 2^511]`, or
   * zero otherwise. Inside that range the largest square is a normal binary64
   * number and the sum of three squares cannot overflow, so the plain formula
   * is safe; zero and non-finite vectors also return zero and take it.
   */
  const normalizationScale: (a: IAutoMovieVector3) => number = (
    a: IAutoMovieVector3,
  ): number => {
    const largest: number = Math.max(
      Math.abs(a.x),
      Math.abs(a.y),
      Math.abs(a.z),
    );
    return extremeScale(largest);
  };

  /**
   * Shared binary64 magnitude gate; zero and nonfinite inputs retain the
   * ordinary norm path.
   */
  const extremeScale: (largest: number) => number = (
    largest: number,
  ): number =>
    largest > 0 &&
    (largest < 2 ** -511 || largest > 2 ** 511)
      ? largest
      : 0;

  /**
   * The component-wise linear interpolation `a + (b - a) · t`, giving `a` at `t
   * = 0` and `b`, up to rounding, at `t = 1`; a `t` outside `[0, 1]`
   * extrapolates.
   */
  export const lerp: (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    t: number,
  ) => IAutoMovieVector3 = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    t: number,
  ): IAutoMovieVector3 => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  });

  /**
   * Snapshot a fixed segment and read fresh points on its affine line. The
   * endpoints must use the same frame and units. Construction reads each
   * component in lerp's original a, b, a order and copies its origin and
   * completed difference; later endpoint edits are not observed. Each t is
   * evaluated as origin + difference * t, without clipping or endpoint
   * shortcuts, so extrapolation and nonfinite arithmetic remain available.
   */
  export function prepareLerp(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ): (t: number) => IAutoMovieVector3 {
    const x: number = from.x;
    const dx: number = to.x - from.x;
    const y: number = from.y;
    const dy: number = to.y - from.y;
    const z: number = from.z;
    const dz: number = to.z - from.z;
    return (t: number): IAutoMovieVector3 => ({
      x: x + dx * t,
      y: y + dy * t,
      z: z + dz * t,
    });
  }
}
