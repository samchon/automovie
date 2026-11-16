import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Pure vector math over {@link IAutoMovieVector3} (`{ x, y, z }`).
 *
 * Operations return fresh values unless their name explicitly ends in Into;
 * those write only the supplied target after reading every source component.
 * The engine keeps this small math layer independent of the renderer so it
 * runs headless without depending on `three.js`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the record shape, fresh-value and explicit write-target ownership, and why the engine keeps its own math instead of `three.js`.
 * @evidence contracts/development/design.md#principled-representation Three scalar components describe a vector or point in the caller's frame and unit; addition, subtraction, products, norm, distance and interpolation preserve those ordinary Euclidean meanings without another coordinate representation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The engine's shared vector operations serve geometry, FK and physical computation. distance serves actual bend residuals and two-bone lengths without an unused displacement record; crossDifferenceInto writes the raw hull candidate perpendicular into its private scratch without two edge records and a cross-product record.
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
   * Write `(a - origin) × (b - origin)` into a caller-owned target.
   * The two differences and right-handed cross product retain subtract/cross
   * arithmetic, including nonfinite values and signed zeros. Every source is
   * read before any write, so target may alias origin, a or b.
   *
   * @param target Mutable output; its previous components are not read.
   * @param origin Common edge origin in the same frame and unit as a and b.
   * @param a First edge endpoint, read before the second endpoint.
   * @param b Second edge endpoint; reversing endpoints reverses orientation.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the oriented differences, explicit mutable output, source read order, alias safety and unaltered raw arithmetic.
   * @evidence contracts/development/implementation.md#principled-implementation Computes the six differences in subtract(a, origin), subtract(b, origin) order, then the same three determinant expansions as cross before publishing X, Y and Z.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One write-target operation owns the compound cross of two point differences used by physical hull face candidates; ordinary cross and subtract remain the fresh-value operations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No normalization, finite gate, zero shortcut, reassociation or geometric tolerance changes the six subtractions and three cross-product expressions.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar work replaces the raw hull candidate's two displacement records and cross record, with exactly the same arithmetic and no temporary vector allocation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A hull scan reuses its own private output record across candidate triples; every invocation recomputes the current point differences and determinant with no point or result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only nine local scalars live during the call; the caller owns the target lifetime and no source or target is retained by the math layer.
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
   * `Math.sqrt(dot(a, a))`, so the result equals that expression exactly.
   * When the largest component is below `2^-511` or above `2^511`, squaring
   * would underflow or overflow, and `Math.hypot` measures it instead, so any
   * representable length is returned. A non-finite component gives a
   * non-finite length.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The Euclidean norm; `Math.sqrt(dot(a, a))` is exact to rounding when no square leaves the normal range, and `Math.hypot`, which the ECMAScript specification directs implementations to compute without that overflow and underflow, covers the extreme magnitudes where squaring fails.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The private extremeScale owns the range gate for length, normalize and distance; normalizationScale keeps the existing vector-component read order for length and normalize.
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
   * Euclidean distance between two points in the same frame and unit.
   * It equals length(subtract(a, b)) with the same ordinary arithmetic,
   * extreme-magnitude branch and nonfinite propagation, without a vector.
   *
   * @param a The first point, read before b on each X/Y/Z subtraction.
   * @param b The second point in the same frame and unit.
   * @returns Their scalar separation in that unit, including the original nonfinite result.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States matching frames/units, operand-read order, exact length/subtract equivalence and scalar/nonfinite output.
   * @evidence contracts/development/implementation.md#principled-implementation Forms the same three differences as subtract, then evaluates the same expanded self-dot square root or extreme Math.hypot selected by the shared binary64 magnitude gate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A scalar point-distance operation beside length serves consumers that never use the displacement; extremeScale remains the single owner of magnitude thresholds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps subtraction order, left-associated square sum, zero, NaN and infinity behavior and the existing extreme branch; no hypot-only replacement, distance tolerance, snapping or finite repair is added.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three scalar differences and the same fixed-size magnitude/norm work omit one displacement allocation per query. Both magnitude branches remain constant work, with runtime speedup unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the existing norm's magnitude policy and arithmetic on the exact completed differences; every current point pair is actually evaluated and no distance or point is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one number, allocates no vector or collection and retains neither point nor any operation state.
   */
  export function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    const x: number = a.x - b.x;
    const y: number = a.y - b.y;
    const z: number = a.z - b.z;
    const largest: number = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
    return extremeScale(largest) === 0
      ? Math.sqrt(x * x + y * y + z * z)
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Divides by the Euclidean length after the original positive extreme rescaling. The existing magnitude gate already proves an unscaled input takes length's ordinary square-root branch; a rescaled finite input has largest magnitude one, so it takes that same branch. Direct sqrt(dot(value,value)) therefore preserves the original norm arithmetic without repeating the range classification. Zero and nonfinite values retain their ordinary arithmetic and declared propagation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure normalize and length share the private magnitude gate, while normalize uses its completed classification to read the same self-dot square root directly and reuses scale for output construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The zero vector for zero length is the stated degenerate value with no direction to keep, not a fallback; the rescaling thresholds are binary64 limits, and a non-finite input stays non-finite instead of being replaced.
   * @evidence contracts/development/common.md#meaningful-documentation States the zero-length result, the extreme-range rescaling and what it preserves, and the non-finite behavior.
   * @evidence contracts/development/implementation.md#efficient-algorithms One magnitude test, a three-term self-dot square root and three output products take constant work. Reusing the first gate removes the second three-component magnitude scan that length would repeat; extreme inputs keep the original scaled temporary. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The selected positive rescaling supplies all normalized components and proves the norm's ordinary branch within this call. No direction or magnitude result survives the call or a change to source coordinates.
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
    const len: number = Math.sqrt(dot(value, value));
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

  /** Shared binary64 magnitude gate; zero and nonfinite inputs retain the ordinary norm path. */
  const extremeScale: (largest: number) => number = (largest: number): number =>
    Number.isFinite(largest) &&
      largest > 0 &&
      (largest < 2 ** -511 || largest > 2 ** 511)
      ? largest
      : 0;

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
