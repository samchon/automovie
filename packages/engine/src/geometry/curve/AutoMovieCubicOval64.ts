/** Four-quarter affine cubic-oval sizing in consistent caller units. The quarter-circle handle ratio is 4/3*tan(pi/8); independent anatomical admissibility remains with consumers.
 *
 * @evidence contracts/common.md#principled-implementation Eight-point Gauss-Legendre and composite Simpson paths integrate four affine quarter-circle cubics with their retained derivative formulas; each inverse bisects its own perimeter owner.
 * @evidence contracts/common.md#clear-and-simple-design One scalar geometry owner shares the exact quarter-circle handle convention between integration and inversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy, ellipse analytic perimeter approximation or tolerance-driven early termination changes the cubic equation.
 * @evidence contracts/common.md#meaningful-documentation Input/output lengths use the same arbitrary unit; the inverse retains its strict positive feasibility premise and fixed iteration count.
 * @evidence contracts/performance.md#efficient-algorithms The Gauss path uses eight samples and exactly 64 inverse iterations; the separately exposed Simpson path uses its declared interval count and midpoint-stagnation stop.
 * @evidence contracts/performance.md#reuse-equivalent-work Inverse queries use this one perimeter owner and retain their current bracket between iterations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only local scalar brackets and quadrature arrays are retained during a call; no model or global cache exists.
 */
export namespace AutoMovieCubicOval64 {
  /** Symmetric quarter-circle cubic handle/radius ratio. */
  export const rounding: number = (4 / 3) * Math.tan(Math.PI / 8);

  /** Approximate the perimeter of the affine cubic oval with eight-point Gauss-Legendre quadrature. Nonfinite or negative diameters reject.
   *
   * @evidence contracts/common.md#principled-implementation Each quadrature sample evaluates the original cubic derivative and adds its weighted Euclidean norm.
   * @evidence contracts/common.md#clear-and-simple-design Diameter halving, quarter symmetry and interval mapping are explicit in one operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The actual cubic perimeter is integrated instead of replacing the curve by a true ellipse or pi times a diameter.
   * @evidence contracts/common.md#meaningful-documentation Diameters are finite nonnegative values in one unit, and the returned length uses that unit.
   * @evidence contracts/performance.md#efficient-algorithms Eight fixed quadrature nodes give constant work per perimeter query.
   * @evidence contracts/performance.md#reuse-equivalent-work A call shares one diameter pair and handle ratio across its eight samples.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Nodes and weights are local fixed arrays; only the scalar perimeter escapes.
   */
  export function perimeter(diameterU: number, diameterV: number): number {
    const nodes: readonly number[] = [
      -0.9602898564975363, -0.7966664774136267, -0.525532409916329,
      -0.1834346424956498, 0.1834346424956498, 0.525532409916329,
      0.7966664774136267, 0.9602898564975363,
    ];
    const weights: readonly number[] = [
      0.1012285362903763, 0.2223810344533745, 0.3137066458778873,
      0.362683783378362, 0.362683783378362, 0.3137066458778873,
      0.2223810344533745, 0.1012285362903763,
    ];
    if (
      ![diameterU, diameterV].every(
        (v: number): boolean => Number.isFinite(v) && v >= 0,
      )
    )
      throw new Error("Nonnegative finite section diameters required");
    const a: number = diameterU / 2,
      b: number = diameterV / 2,
      k: number = rounding;
    // Mapping [-1,1] to [0,1] contributes 1/2; four symmetric quarters give the factor two.
    return (
      2 *
      nodes.reduce((sum: number, x: number, i: number): number => {
        const t: number = (x + 1) / 2,
          s: number = 1 - t;
        const dx: number = 6 * s * t * (k * a - a) - 3 * t * t * k * a;
        const dy: number = 3 * s * s * k * b + 6 * s * t * (b - k * b);
        return sum + weights[i]! * Math.hypot(dx, dy);
      }, 0)
    );
  }

  /** Resolve the other diameter with 64 bisections while preserving the supplied fixed diameter; no aspect bound is imposed here.
   *
   * @evidence contracts/common.md#principled-implementation A positive feasible circumference brackets the unknown diameter in [0,circumference/2], then 64 bisections use the same cubic perimeter.
   * @evidence contracts/common.md#clear-and-simple-design The inverse retains one monotone scalar bracket with no solver object.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomical aspect bound or replacement fixed diameter is imposed by the generic solve.
   * @evidence contracts/common.md#meaningful-documentation Requires finite fixedDiameter>0 and circumference>2*fixedDiameter; returned diameter uses the same unit.
   * @evidence contracts/performance.md#efficient-algorithms Exactly 64 iterations each perform eight-point quadrature.
   * @evidence contracts/performance.md#reuse-equivalent-work Each iteration preserves and narrows the prior bracket rather than restarting an independent search.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only scalar bracket endpoints and the returned diameter survive within the call.
   */
  export function otherDiameter(
    circumference: number,
    fixedDiameter: number,
  ): number {
    if (
      !(
        Number.isFinite(circumference) &&
        Number.isFinite(fixedDiameter) &&
        fixedDiameter > 0 &&
        circumference > 2 * fixedDiameter
      )
    )
      throw new Error(
        "Incompatible cubic oval circumference and fixed diameter",
      );
    let lo: number = 0,
      hi: number = circumference / 2;
    for (let i: number = 0; i < 64; i++) {
      const mid: number = (lo + hi) / 2;
      if (perimeter(mid, fixedDiameter) < circumference) lo = mid;
      else hi = mid;
    }
    const result: number = (lo + hi) / 2;
    return result;
  }

  /** Approximate the four-quarter cubic perimeter by composite Simpson quadrature with the retained sqrt(2) handle formula. Positive finite millimetre diameters and an even interval count of at least two are required; default count is 256 per quarter.
   *
   * @evidence contracts/common.md#principled-implementation The cubic derivative norm is summed with alternating Simpson weights and the original accumulation order.
   * @evidence contracts/common.md#clear-and-simple-design The Simpson sizing path is explicit and separate from the eight-point quadrature path; consumers retain their numerical contract.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The original handle formula, accumulation order and stopping policy remain explicit; anatomical admission is outside this operation.
   * @evidence contracts/common.md#meaningful-documentation Approximate the four-quarter cubic perimeter by composite Simpson quadrature with the retained sqrt(2) handle formula. Positive finite millimetre diameters and an even interval count of at least two are required; default count is 256 per quarter.
   * @evidence contracts/performance.md#efficient-algorithms O(N) quadrature samples and constant scalar storage for N intervals.
   * @evidence contracts/performance.md#reuse-equivalent-work The current bracket or unit-aspect perimeter is reused within one solve without cross-request result retention.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned scalar dimensions escape; no geometry owner, input object or work arrays are cached.
   */
  export function perimeterBySimpson(
    breadth: number,
    depth: number,
    intervals: number = 256,
  ): number {
    if (
      ![breadth, depth].every(Number.isFinite) ||
      breadth <= 0 ||
      depth <= 0 ||
      !Number.isInteger(intervals) ||
      intervals < 2 ||
      intervals % 2 !== 0
    )
      throw new Error(
        "Positive cubic ellipse dimensions and even quadrature count required",
      );
    const a: number = breadth / 2;
    const b: number = depth / 2;
    const k: number = (4 * (Math.sqrt(2) - 1)) / 3;
    let sum: number = 0;
    for (let i: number = 0; i <= intervals; i++) {
      const t: number = i / intervals;
      const dx: number = 3 * (2 * (1 - t) * t * (k * a - a) - t * t * k * a);
      const dz: number =
        3 * ((1 - t) ** 2 * k * b + 2 * (1 - t) * t * (b - k * b));
      sum +=
        (i === 0 || i === intervals ? 1 : i % 2 ? 4 : 2) * Math.hypot(dx, dz);
    }
    return (4 * sum) / (3 * intervals);
  }

  /** Resolve breadthMm/depthMm at a fixed positive breadth/depth ratio using the same Simpson perimeter. Both inputs must be positive finite values; circumference and returned diameters are in millimetres.
   *
   * @evidence contracts/common.md#principled-implementation Uniform scaling by target circumference divided by the unit-aspect cubic perimeter preserves the supplied aspect.
   * @evidence contracts/common.md#clear-and-simple-design The Simpson sizing path is explicit and separate from the eight-point quadrature path; consumers retain their numerical contract.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The original handle formula, accumulation order and stopping policy remain explicit; anatomical admission is outside this operation.
   * @evidence contracts/common.md#meaningful-documentation Resolve breadthMm/depthMm at a fixed positive breadth/depth ratio using the same Simpson perimeter. Both inputs must be positive finite values; circumference and returned diameters are in millimetres.
   * @evidence contracts/performance.md#efficient-algorithms One default 256-interval quadrature and fixed scalar scaling.
   * @evidence contracts/performance.md#reuse-equivalent-work The current bracket or unit-aspect perimeter is reused within one solve without cross-request result retention.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned scalar dimensions escape; no geometry owner, input object or work arrays are cached.
   */
  export function axesBySimpson(
    girthMm: number,
    breadthOverDepth: number = 1,
  ): {
    /** Positive lateral support separation of the normalized cubic oval, mm. */
    breadthMm: number;

    /** Positive anterior/posterior support separation of that same oval, mm. */
    depthMm: number;
  } {
    if (
      ![girthMm, breadthOverDepth].every(Number.isFinite) ||
      girthMm <= 0 ||
      breadthOverDepth <= 0
    )
      throw new Error("Positive girth and independent breadth/depth required");
    const scale: number = girthMm / perimeterBySimpson(breadthOverDepth, 1);
    return { breadthMm: breadthOverDepth * scale, depthMm: scale };
  }

  /** Resolve the second diameter from circumference and a fixed first diameter using Simpson quadrature. Inputs are finite millimetre lengths with circumference greater than twice the positive fixed diameter; at most 64 bisections stop when the bracket cannot refine in binary64.
   *
   * @evidence contracts/common.md#principled-implementation A monotone diameter bracket is narrowed with the same perimeter owner; midpoint stagnation stops without changing the fixed diameter.
   * @evidence contracts/common.md#clear-and-simple-design The Simpson sizing path is explicit and separate from the eight-point quadrature path; consumers retain their numerical contract.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The original handle formula, accumulation order and stopping policy remain explicit; anatomical admission is outside this operation.
   * @evidence contracts/common.md#meaningful-documentation Resolve the second diameter from circumference and a fixed first diameter using Simpson quadrature. Inputs are finite millimetre lengths with circumference greater than twice the positive fixed diameter; at most 64 bisections stop when the bracket cannot refine in binary64.
   * @evidence contracts/performance.md#efficient-algorithms At most 64 default-quadrature evaluations and constant scalar bracket storage.
   * @evidence contracts/performance.md#reuse-equivalent-work The current bracket or unit-aspect perimeter is reused within one solve without cross-request result retention.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned scalar dimensions escape; no geometry owner, input object or work arrays are cached.
   */
  export function otherDiameterBySimpson(
    girthMm: number,
    breadthMm: number,
  ): number {
    if (
      ![girthMm, breadthMm].every(Number.isFinite) ||
      breadthMm <= 0 ||
      girthMm <= 2 * breadthMm
    )
      throw new Error("Girth must exceed the collapsed section perimeter");
    let low: number = 0;
    let high: number = girthMm / 2;
    for (let i: number = 0; i < 64; i++) {
      const mid: number = (low + high) / 2;
      if (mid === low || mid === high) break;
      if (perimeterBySimpson(breadthMm, mid) < girthMm) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  }
}
