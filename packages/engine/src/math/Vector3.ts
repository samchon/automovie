import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Pure vector math over {@link IAutoMovieVector3} (`{ x, y, z }`).
 *
 * Every function leaves its inputs unchanged and returns a new value. The
 * engine keeps this small math layer instead of depending on `three.js`, so it
 * stays independent of the renderer and runs headless.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the record shape, that inputs are never changed, and why the engine keeps its own math instead of `three.js`.
 * @evidence contracts/development/design.md#principled-representation Represents Pure vector math over (`{ x, y, z }`): companion namespace of 10 members (`create`, `add`, `subtract`, `scale`, `dot`, `cross`, ...); units and frames named in its text: frame, world, quaternion. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `Vector3` in packages/engine/src/math/Vector3.ts; its surface is the 10 members listed and the text shows 481 other files naming it, mostly packages/engine (176), movies (159), test (74), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace Vector3 {
  /**
   * A new vector from its components, each zero when omitted.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Copies the three arguments into a record, with zero defaults so `create()` is the origin.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Positional components with defaults, the shortest way for callers to build the origin or an axis-aligned vector inline.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Stores exactly the given components with no rounding or validation special case.
   * @evidence contracts/development/common.md#meaningful-documentation States the zero default and that the record is new.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One record literal with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A fresh record per call that coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The new coordinate record owns three supplied scalars, including zero defaults, and no global origin object is shared.
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
   * The component-wise sum `a + b`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Vector addition is defined per component, so each output component is the binary64 sum of the matching inputs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One two-operand sum, the form every caller needs; a longer sum chains it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every coordinate is added directly; zero or axis-aligned operands receive no special arithmetic path.
   * @evidence contracts/development/common.md#meaningful-documentation States the operation and that it is component-wise, the one fact the name leaves implicit.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three additions with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Position and offset sums depend on current coordinate values, and this operation stores no prior addition result.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Three coordinate sums transfer into one fresh record, leaving both input objects unretained and unchanged.
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
   * The component-wise difference `a - b`, the vector from `b` to `a`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Vector subtraction is defined per component, and `a − b` is the displacement that carries point `b` to point `a`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Its own function because a displacement between two points is the most common vector query, and computing it directly takes one allocation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The displacement keeps the same operand order on every axis, without snapping small differences to zero.
   * @evidence contracts/development/common.md#meaningful-documentation States the operand order and its geometric meaning, which is the fact a caller gets wrong when it is implicit.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three subtractions with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A displacement belongs to its current endpoint coordinates; there is no retained endpoint-pair result to invalidate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources One fresh displacement record holds three differences and retains neither source point.
   */
  export const subtract: (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ) => IAutoMovieVector3 = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

  /**
   * Every component of `a` multiplied by the scalar `s`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Scalar multiplication is defined per component, so the direction is kept for positive `s` and reversed for negative `s`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A uniform scalar factor only; the one non-uniform scaling the engine needs happens through matrices.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Multiplies every component by the same factor with no special case for zero or one.
   * @evidence contracts/development/common.md#meaningful-documentation States that the factor is one scalar applied to every component.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three multiplications with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one vector and a scalar that coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned scaled coordinates are independent scalar values; no factor object or source vector is retained.
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
   * The dot product `a · b`, which is `|a| |b| cos θ`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The Euclidean inner product, the sum of component products, evaluated left to right so the rounding is the same on every call.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns the bare scalar; projection, angle and length callers build on it instead of each summing products themselves.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Sums the three products in a fixed order with no compensated or reordered summation for particular inputs.
   * @evidence contracts/development/common.md#meaningful-documentation States the geometric meaning a caller uses it for, beyond the name.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three multiplications and two additions with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each inner product uses the current pair of vector components; projection callers own any reuse of the resulting scalar.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Component products sum directly to a scalar without allocating a record or retaining operands.
   */
  export const dot: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): number => a.x * b.x + a.y * b.y + a.z * b.z;

  /**
   * The right-handed cross product `a × b`, perpendicular to both with length
   * `|a| |b| sin θ`, so `cross(X, Y)` is `Z`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The determinant expansion of the cross product in a right-handed frame, which is the handedness glTF and the engine's world frame use.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One right-handed product matching the engine's single world handedness.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Computes every component by the same formula with no normalization or zero special case, so a parallel pair yields the exact zero vector a caller can test for.
   * @evidence contracts/development/common.md#meaningful-documentation States the handedness with an example, the direction, and the length formula.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Six multiplications and three subtractions with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The oriented perpendicular depends on the current ordered pair; swapping or changing an operand requires a new product.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Three determinant components form one owned perpendicular record, and neither input direction is retained.
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
   * The Euclidean length of `a`.
   *
   * Components whose squares stay in the normal binary64 range use
   * `Math.sqrt(dot(a, a))`, so the result equals that expression exactly.
   * When the largest component is below `2^-511` or above `2^511`, squaring
   * would underflow or overflow, and `Math.hypot` measures it instead, so any
   * representable length is returned. A non-finite component gives a
   * non-finite length.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The Euclidean norm; `Math.sqrt(dot(a, a))` is exact to rounding when no square leaves the normal range, and `Math.hypot`, which the ECMAScript specification directs implementations to compute without that overflow and underflow, covers the extreme magnitudes where squaring fails.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The range test lives in the private `normalizationScale` shared with `normalize`, so both functions agree on which vectors are extreme.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The `2^-511` and `2^511` thresholds are the binary64 limits where a square underflows or overflows, not values tuned to a caller; ordinary input keeps `sqrt(dot)` so its result stays identical to that expression wherever callers compute it directly.
   * @evidence contracts/development/common.md#meaningful-documentation States which formula applies in which magnitude range and why, that ordinary results equal `sqrt(dot)` exactly, and the non-finite behavior.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One maximum of three magnitudes and one square root in constant time, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The magnitude range is read from the current components once; no length cache survives mutations of a vector record.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Magnitude checks and the returned norm use scalars only, with no allocated vector or retained source.
   */
  export const length: (a: IAutoMovieVector3) => number = (
    a: IAutoMovieVector3,
  ): number =>
    normalizationScale(a) === 0
      ? Math.sqrt(dot(a, a))
      : Math.hypot(a.x, a.y, a.z);

  /**
   * A unit-length vector in the direction of `a`, or the zero vector when `a`
   * has length zero.
   *
   * A vector whose largest component is below `2^-511` or above `2^511` is
   * first divided by that component, so even subnormal components or a length
   * that would overflow keep their direction. A non-finite component gives a
   * non-finite result.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Divides by the Euclidean length, after rescaling an extreme vector by its largest component magnitude, which leaves the direction unchanged up to rounding and brings the squares into the normal range before `length` measures them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reuses `length` and `scale` for the ordinary path and the private `normalizationScale` for the extreme-range test, so the two magnitude functions share one definition of extreme.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The zero vector for zero length is the stated degenerate value with no direction to keep, not a fallback; the rescaling thresholds are binary64 limits, and a non-finite input stays non-finite instead of being replaced.
   * @evidence contracts/development/common.md#meaningful-documentation States the zero-length result, the extreme-range rescaling and what it preserves, and the non-finite behavior.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One magnitude test, one length and three multiplications in constant time, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The selected positive rescaling supplies all normalized components within the call; directions are not cached for mutable source records.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Allocates the rescaled vector when extreme and the returned record, and retains nothing.
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
    return Number.isFinite(largest) &&
      largest > 0 &&
      (largest < 2 ** -511 || largest > 2 ** 511)
      ? largest
      : 0;
  };

  /**
   * The component-wise linear interpolation `a + (b - a) · t`, giving `a` at
   * `t = 0` and `b`, up to rounding, at `t = 1`; a `t` outside `[0, 1]`
   * extrapolates.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The affine combination `a + (b − a)·t` per component, which returns `a` exactly at `t = 0`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One interpolation for positions and offsets; rotations interpolate through `Quaternion.slerp` instead.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `t` is not clamped, so a caller that extrapolates gets the line's value instead of a silently pinned endpoint.
   * @evidence contracts/development/common.md#meaningful-documentation States the formula, the endpoint values, and that an out-of-range `t` extrapolates.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three subtractions, multiplications and additions with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of two vectors and a parameter that coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each interpolated point owns three computed coordinates, with no endpoint or progress history retained.
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
}
