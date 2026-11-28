import type {
  AutoMovieVector3Tuple,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Pure vector math over {@link IAutoMovieVector3} records and Cartesian tuples.
 *
 * Operations return fresh values unless their name explicitly ends in Into;
 * those write only the supplied target after reading every source component.
 * The engine keeps this small math layer independent of the renderer so it runs
 * headless without depending on `three.js`.
 */
export namespace AutoMovieEngineVector3 {
  /**
   * Check whether all three coordinates are finite numbers.
   *
   * Zero and signed zero pass. A coordinate that is NaN or either infinity
   * makes the result false.
   */
  export function isFinite(value: Readonly<IAutoMovieVector3>): boolean {
    return (
      Number.isFinite(value.x) &&
      Number.isFinite(value.y) &&
      Number.isFinite(value.z)
    );
  }

  /**
   * Create a mutable Cartesian vector from its X, Y and Z components.
   *
   * Each omitted component defaults to zero. Supplied numbers are stored
   * directly, and the result is a fresh record.
   */
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

  /**
   * Add two Cartesian vectors component by component.
   *
   * Use the same coordinate frame and units for both operands. The operation
   * returns a fresh vector with ordinary binary64 addition.
   */
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

  /**
   * Return the displacement from the second vector to the first.
   *
   * Subtract corresponding coordinates in the same frame and unit. The
   * operation returns a fresh vector.
   */
  export const subtract: (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ) => IAutoMovieVector3 = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

  /**
   * Multiply each Cartesian coordinate by the supplied scalar.
   *
   * The result is a fresh vector. Each multiplication follows ordinary binary64
   * rounding and overflow.
   */
  export const scale: (a: IAutoMovieVector3, s: number) => IAutoMovieVector3 = (
    a: IAutoMovieVector3,
    s: number,
  ): IAutoMovieVector3 => ({
    x: a.x * s,
    y: a.y * s,
    z: a.z * s,
  });

  /**
   * Return a fresh point formed by adding a scaled direction to a base point.
   *
   * Use compatible frames and offset units. Products are evaluated before the
   * coordinate sums, with the same binary64 behavior as separately scaling the
   * direction and adding it.
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

  /**
   * Return the dot product of two vectors in the same Cartesian frame.
   *
   * Multiply corresponding coordinates and add the three products. For unit
   * vectors the mathematical result is the cosine of their angle.
   */
  export const dot: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): number => a.x * b.x + a.y * b.y + a.z * b.z;

  /**
   * Return the right-handed cross product of two Cartesian vectors.
   *
   * The first cross the second establishes orientation, so X cross Y gives
   * positive Z. The result is a fresh vector.
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
   * Write the right-handed cross product of two edges sharing an origin into a
   * caller-owned vector.
   *
   * Read both endpoint differences before writing. The target can alias the
   * origin or either endpoint. Edge order determines orientation, and all
   * operands share a coordinate frame.
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
   * Measure the Euclidean length of a Cartesian vector in its coordinate unit.
   *
   * Ordinary magnitudes use the square root of the dot product with itself.
   * Extreme finite values use a scaled norm to preserve a representable length.
   * The mathematical length itself can exceed the finite numeric range.
   */
  export const length: (a: IAutoMovieVector3) => number = (
    a: IAutoMovieVector3,
  ): number =>
    normalizationScale(a) === 0
      ? Math.sqrt(dot(a, a))
      : Math.hypot(a.x, a.y, a.z);

  /**
   * Measure Euclidean distance between two positions in the same frame and
   * unit.
   *
   * Use the same component subtraction and norm as measuring their
   * displacement. Large component differences or a true length outside the
   * finite range can produce a nonfinite result.
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
   * Return a unit vector in the same direction, or a fresh zero vector for a
   * zero input.
   *
   * For an extreme finite magnitude, divide coordinates by the largest absolute
   * component before measuring the norm. This retains direction when the
   * original norm is subnormal or too large to represent. Callers admit finite
   * coordinates where their model requires them.
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
   * Normalize a Cartesian tuple in X, Y, Z order.
   *
   * Return a fresh unit tuple or a fresh zero tuple for a zero input. The
   * vector normalizer supplies the same scaling for extreme finite components.
   */
  export function normalizeTuple(
    value: Readonly<AutoMovieVector3Tuple>,
  ): AutoMovieVector3Tuple {
    const result: IAutoMovieVector3 = normalize({
      x: value[0],
      y: value[1],
      z: value[2],
    });
    return [result.x, result.y, result.z];
  }

  /**
   * Evaluate component-wise linear interpolation between two vectors.
   *
   * For each coordinate the operation adds the start to the endpoint difference
   * multiplied by the parameter. Values outside the closed unit interval
   * extrapolate. Ordinary binary64 operations apply, including overflow in the
   * difference.
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
   * Snapshot a vector segment and return a function that evaluates its affine
   * line.
   *
   * Use one Cartesian frame and unit for both endpoints. The evaluator retains
   * the initial origin and coordinate differences. Later edits to the endpoint
   * records are invisible. Each call returns a fresh vector and allows
   * extrapolation.
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

  /*
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

  /*
   * Shared binary64 magnitude gate; zero and nonfinite inputs retain the
   * ordinary norm path.
   */
  const extremeScale: (largest: number) => number = (
    largest: number,
  ): number =>
    largest > 0 && (largest < 2 ** -511 || largest > 2 ** 511) ? largest : 0;
}
