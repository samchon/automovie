import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/**
 * Scale-safe direction arithmetic for the existing construction axes.
 *
 * Ordinary normal magnitudes retain the original dot/subtract/hypot/reciprocal-multiply order. A subnormal or unrepresentable projected norm instead causes max-component scaling of the input direction before projection. Normalization likewise scales a vector before measuring it when its norm is subnormal or overflows. This preserves direction rather than dividing by a subnormal hypot rounded to one representable step.
 *
 * @evidence contracts/common.md#principled-implementation Uses positive homogeneous scaling before ill-scaled dot projection or normalization, preserving the mathematical direction and the admitted caller's original tangent plane.
 * @evidence contracts/common.md#clear-and-simple-design Three constant-work primitives separate projection, unitization and RMF reflection while exposing the norms needed by existing admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometric tolerance, anatomical angle, substitute axis or finite value for an invalid input is introduced.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes ordinary arithmetic preservation, subnormal norm quantization, scaled direction units and caller-owned validity.
 * @evidence contracts/performance.md#efficient-algorithms Constant three-component arithmetic; max scaling occurs only for a subnormal or unrepresentable norm.
 * @evidence contracts/performance.md#reuse-equivalent-work Projected norm is returned for immediate unitization/admission, and reflection reuses its measured squared norm.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one invocation-local direction record or vector; no cache or source is retained.
 */
export namespace AutoMovieAxisDirection {
  /**
   * A projected direction and its same-scale norms for unitization and relative conditioning.
   *
   * @evidence contracts/common.md#principled-implementation Projection and target norms share whichever positive homogeneous scale was used, so their ratio is the relative normal projection.
   * @evidence contracts/common.md#clear-and-simple-design One vector and two scalars carry all projection ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No acceptance or geometric replacement is encoded in this numeric record.
   * @evidence contracts/common.md#meaningful-documentation Members state the adjusted direction scale and its norm interpretation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This data record computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The producer and caller own reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the fixed-size record.
   */
  export interface IProjection {
    /** Direction in the original or positively scaled input's normal plane. */
    vector: AutoMovieSolidVector.Vec3;
    /** Norm of vector in that same scale. */
    normalNorm: number;
    /** Full target norm in the same scale; ratio normalNorm/targetNorm drives admission. */
    targetNorm: number;
  }

  /**
   * Project a direction off an admitted unit tangent, preserving ordinary arithmetic.
   *
   * @evidence contracts/common.md#principled-implementation Orthogonal subtraction is recomputed from max-scaled input when its raw norm is subnormal or nonfinite; the same positive scale changes neither direction nor relative projection. If whole-input scaling erases a finite nonzero raw normal component, that original projection/norm scale is retained for safe unitization.
   * @evidence contracts/common.md#clear-and-simple-design Returns the projected vector and both same-scale norms without making an axis admission decision.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retains zero/nonfinite results when the input has no usable finite scaling; it does not invent a frame or weaken the caller's conditioning rule.
   * @evidence contracts/common.md#meaningful-documentation Requires the caller's admitted unit tangent and explains optional full-norm reuse and scale ownership.
   * @evidence contracts/performance.md#efficient-algorithms One ordinary projection and hypot; the exceptional numeric regime adds one fixed-size rescaling and projection.
   * @evidence contracts/performance.md#reuse-equivalent-work Accepts an already measured target norm and returns the projected norm for unitization.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only one returned fixed-size record survives; all input data remains caller-owned and unmodified.
   */
  export function project(up: AutoMovieSolidVector.Vec3, tangent: AutoMovieSolidVector.Vec3, targetNorm: number = Math.hypot(...up)): IProjection {
    let vector: AutoMovieSolidVector.Vec3 = AutoMovieSolidVector.sub(up, AutoMovieSolidVector.scale(tangent, AutoMovieSolidVector.dot(up, tangent)));
    let normalNorm: number = Math.hypot(...vector);
    if (!Number.isFinite(normalNorm) || normalNorm < MINIMUM_NORMAL) {
      const magnitude: number = Math.max(...up.map(Math.abs));
      if (Number.isFinite(magnitude) && magnitude > 0) {
        const scaled: AutoMovieSolidVector.Vec3 = up.map((value: number): number => value / magnitude) as AutoMovieSolidVector.Vec3;
        const scaledVector: AutoMovieSolidVector.Vec3 = AutoMovieSolidVector.sub(scaled, AutoMovieSolidVector.scale(tangent, AutoMovieSolidVector.dot(scaled, tangent)));
        const scaledNorm: number = Math.hypot(...scaledVector);

        // Scaling an enormous tangent component must not erase a representable raw normal.
        if (scaledNorm > 0 || !(Number.isFinite(normalNorm) && normalNorm > 0)) {
          targetNorm = Math.hypot(...scaled);
          vector = scaledVector;
          normalNorm = scaledNorm;
        }
      }
    }
    return { vector, normalNorm, targetNorm };
  }

  /**
   * A unit direction, preserving zero/invalid inputs for the caller's admission path.
   *
   * @evidence contracts/common.md#principled-implementation The ordinary reciprocal multiply is preserved for normal finite norms; max-component scaling measures subnormal/overflowing norms without quantizing the direction.
   * @evidence contracts/common.md#clear-and-simple-design One vector operation serves tangent and projected-up normalization.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not replace zero or nonfinite inputs with an arbitrary axis, and uses no minimum geometric length.
   * @evidence contracts/common.md#meaningful-documentation States optional same-vector norm reuse and invalid-input ownership.
   * @evidence contracts/performance.md#efficient-algorithms Constant three-component work with an additional rescaling only outside the ordinary numeric regime.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses a supplied norm; otherwise measures it once.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one local vector and retains no state.
   */
  export function unit(vector: AutoMovieSolidVector.Vec3, norm: number = Math.hypot(...vector)): AutoMovieSolidVector.Vec3 {
    if (!(norm > 0)) return vector;
    if (Number.isFinite(norm) && norm >= MINIMUM_NORMAL) return AutoMovieSolidVector.scale(vector, 1 / norm);
    const magnitude: number = Math.max(...vector.map(Math.abs));
    if (!(Number.isFinite(magnitude) && magnitude > 0)) return vector;
    const scaled: AutoMovieSolidVector.Vec3 = vector.map((value: number): number => value / magnitude) as AutoMovieSolidVector.Vec3;
    return AutoMovieSolidVector.scale(scaled, 1 / Math.hypot(...scaled));
  }

  /**
   * Reflect an admitted unit direction in a finite Householder normal, retaining the existing ordinary formula.
   *
   * @evidence contracts/common.md#principled-implementation Uses a-2v(v.a)/(v.v); only an underflowing/overflowing squared norm switches to the mathematically identical unit-normal expression. A truly zero normal retains the existing identity convention.
   * @evidence contracts/common.md#clear-and-simple-design One constant-work reflection is shared by both RMF reflections.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No minimum geometric chord, sampled frame, substitute direction or modified transport theory is introduced.
   * @evidence contracts/common.md#meaningful-documentation Requires an admitted unit input direction, states squared-norm reuse, the numerical branch and zero-normal convention.
   * @evidence contracts/performance.md#efficient-algorithms Ordinary reflection retains its original dot/divide/multiply sequence; the exceptional numeric range adds one safe normalization.
   * @evidence contracts/performance.md#reuse-equivalent-work Accepts the caller's already measured squared norm and delegates exceptional unitization to the same owner.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one local vector; zero-normal identity returns the supplied vector and retains no new state.
   */
  export function reflect(vector: AutoMovieSolidVector.Vec3, direction: AutoMovieSolidVector.Vec3, squaredNorm: number = AutoMovieSolidVector.dot(direction, direction)): AutoMovieSolidVector.Vec3 {
    if (Number.isFinite(squaredNorm) && squaredNorm >= MINIMUM_NORMAL)
      return AutoMovieSolidVector.sub(vector, AutoMovieSolidVector.scale(direction, (2 / squaredNorm) * AutoMovieSolidVector.dot(direction, vector)));
    if (direction.every((value: number): boolean => value === 0)) return vector;
    const normal: AutoMovieSolidVector.Vec3 = unit(direction);
    return AutoMovieSolidVector.sub(vector, AutoMovieSolidVector.scale(normal, 2 * AutoMovieSolidVector.dot(normal, vector)));
  }
}

/** Smallest normal binary64 magnitude; this is a representation boundary, not an axis length or anatomical tolerance. */
const MINIMUM_NORMAL: number = 2 ** -1022;
