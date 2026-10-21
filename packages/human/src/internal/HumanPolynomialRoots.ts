/** Exact real roots of the polynomial represented by finite binary64 powers.
 * IEEE-754 decoding, primitive integer arithmetic, square-free decomposition
 * and Sturm signs retain every coefficient and root multiplicity. This does
 * not certify coefficient measurement error, upstream dot products, physical
 * geometry, or a unique source feature. The main owner performs integration.
 *
 * @evidence contracts/common.md#principled-implementation Positive-scaled pseudo-remainders preserve Sturm signs; primitive GCD and square-free factors give exact multiplicities over the rationals.
 * @evidence contracts/common.md#clear-and-simple-design One bounded stateless isolator returns exact rational brackets and explicitly unresolved root sets; no geometry or branch selection occurs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only exact trailing zeros are removed; no amplitude threshold, root merge, finite-difference derivative or specimen rule occurs.
 * @evidence contracts/common.md#meaningful-documentation Public members state coefficient meaning, interval ownership, multiplicity, budgets and rounded representative limitations.
 * @evidence contracts/performance.md#efficient-algorithms Degree, integer bits, algebra operations, bisections, depth and output roots are caller-bounded; exact Euclidean/Sturm algorithms have coefficient-growth costs rather than a floating-point linear-time claim.
 * @evidence contracts/performance.md#reuse-equivalent-work One square-free Sturm chain and cached endpoint variations serve all subdivisions; factor chains are shared by multiplicity classification.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each call owns its bounded chains, queue and outputs; no cache or external resource survives the call.
 */
export namespace HumanPolynomialRoots {
  /** Exact fraction, serialized without a JSON BigInt extension. */
  export interface Rational {
    /** Signed decimal integer numerator, reduced with the denominator. */
    numerator: string;
    /** Positive decimal integer denominator. */
    denominator: string;
  }

  /** Exact root ownership interval in the input polynomial coordinate. */
  export interface Bracket {
    /** Exact lower endpoint, including dyadics not representable as doubles. */
    lower: Rational;
    /** Exact upper endpoint. */
    upper: Rational;
    /** True excludes the lower endpoint, avoiding a separately owned root. */
    lowerOpen: boolean;
    /** True excludes the upper endpoint, avoiding a separately owned root. */
    upperOpen: boolean;
  }

  /** Explicit resource and refinement limits, with no amplitude tolerance. */
  export interface Budget {
    /** Maximum number of supplied powers, including exact trailing zeros; positive integer. */
    maxCoefficientCount: number;
    /** Maximum degree after removing only exact trailing zeros; nonnegative integer. */
    maxDegree: number;
    /** Maximum bit length of each checked exact integer; positive integer. */
    maxIntegerBits: number;
    /** Maximum charged algebra operations, including sign evaluation and GCD steps. */
    maxOperations: number;
    /** Maximum midpoint subdivisions across the entire call; nonnegative integer. */
    maxBisections: number;
    /** Maximum binary subdivision depth; nonnegative integer. */
    maxDepth: number;
    /** Maximum individually published roots; nonnegative integer. */
    maxRoots: number;
    /** Positive finite bracket width target in the input coordinate's units.
     * This controls refinement only, never degree, root count or root deletion.
     */
    maxAbsoluteWidth: number;
  }

  /** One distinct real root with exact multiplicity in the original polynomial. */
  export interface Root {
    /** Owns exactly one distinct root; nonpoint brackets are open at both ends. */
    bracket: Bracket;
    /** Exact rational midpoint rounded to nearest binary64, ties to even.
     * It may lie outside a narrow open bracket with no interior binary64 value;
     * the exact bracket, not this representative, owns the root.
     */
    approximation: number;
    /** Exact membership of the rounded representative in the owned bracket,
     * including its open/closed endpoints. False does not discard the root.
     */
    approximationInBracket: boolean;
    /** Positive multiplicity from the original polynomial's exact square-free factors. */
    multiplicity: number;
    /** Exact sign of the first nonzero, multiplicity-order derivative of the original polynomial at the root. */
    leadingDerivativeSign: -1 | 1;
    /** Odd-root sign crossing, or even-root tangency. Increasing does not imply a nonzero first derivative when multiplicity exceeds one. */
    orientation: "increasing" | "decreasing" | "tangent";
    /** True means the bracket is an exact rational root point, not merely a narrow interval. */
    exactRational: boolean;
    /** Original interval endpoint ownership, or a strictly interior root. */
    location: "start" | "end" | "interior";
    /** True when the exact bracket width meets the requested target. */
    targetWidthMet: boolean;
  }

  /** Unpublished root set preserved when resources or arithmetic are unresolved. */
  export interface Unresolved {
    /** Remaining root ownership interval; not an approximate missing root list. */
    bracket: Bracket;
    /** Exact distinct count when already established, otherwise null. */
    distinctRootCount: number | null;
    /** Explicit stopped budget or arithmetic condition. */
    reason: string;
    /** Number of completed binary subdivisions from the original interval. */
    depth: number;
  }

  /** Bounded exact-arithmetic accounting; bit length excludes integer signs. */
  export interface Diagnostics {
    /** Charged exact algebra operations; serialization is not an algebra operation. */
    operations: number;
    /** Completed binary subdivisions. */
    bisections: number;
    /** Largest exact integer admitted before a budget stop. */
    largestIntegerBits: number;
    /** Exact interpretation and any stopped condition. */
    condition: string;
  }

  /** All published roots and every unresolved set; discovery order is retained. */
  export interface Isolation {
    /** Complete means every distinct root in the closed interval is published. */
    status: "complete" | "partial" | "flat" | "invalid" | "budget-exhausted";
    /** Degree after exact trailing-zero removal; -1 is zero and -2 is uninspected because input admission stopped. */
    degree: number;
    /** Original supplied power count, including retained exact trailing zeros. */
    originalCoefficientCount: number;
    /** Individually isolated roots; no sorting by rounded approximation is imposed. */
    roots: readonly Root[];
    /** Remaining root sets are never silently discarded. */
    unresolved: readonly Unresolved[];
    /** Exact count for a nonzero polynomial when established, otherwise null. */
    distinctRootCount: number | null;
    /** The zero polynomial vanishes on this entire closed interval. */
    flatInterval?: Bracket;
    /** Resource use and unresolved input or arithmetic conditions. */
    diagnostics: Diagnostics;
  }

  /** Isolate every real root in a closed finite interval of its original coordinate.
   * Coefficients are ascending powers in precisely the supplied coordinate.
   * A caller using local span u must retain its physical affine map separately;
   * this function changes neither coefficient units nor the polynomial gauge.
   * Nonfinite/empty inputs are invalid, and the zero polynomial returns flat.
   * Every stopped preprocessing, subdivision or representative conversion keeps
   * its unresolved domain. Nearest-even representatives can round outside an
   * open root bracket; approximationInBracket reports this exact membership.
   */
  export function isolate(coefficients: readonly number[], interval: { start: number; end: number }, budget: Budget): Isolation {
    const state: State = { budget, operations: 0, bisections: 0, largestIntegerBits: 0 };
    const roots: Root[] = [], unresolved: Unresolved[] = [];
    let degree: number = Array.isArray(coefficients) ? coefficients.length - 1 : -2;
    let total: number | null = null;
    let prepared: boolean = false, active: Work | undefined;
    const pending: Work[] = [];
    const result: (status: Isolation["status"], condition: string) => Isolation = (status: Isolation["status"], condition: string): Isolation => ({
      status, degree, originalCoefficientCount: Array.isArray(coefficients) ? coefficients.length : 0, roots, unresolved, distinctRootCount: total,
      diagnostics: { operations: state.operations, bisections: state.bisections, largestIntegerBits: state.largestIntegerBits, condition },
    });
    const limits: number[] = [budget.maxCoefficientCount, budget.maxDegree, budget.maxIntegerBits, budget.maxOperations, budget.maxBisections, budget.maxDepth, budget.maxRoots];
    if (!Array.isArray(coefficients) || coefficients.length === 0 ||
        !Number.isFinite(interval.start) || !Number.isFinite(interval.end) || interval.start > interval.end ||
        !limits.every((value: number): boolean => Number.isSafeInteger(value) && value >= 0) ||
        budget.maxCoefficientCount < 1 || budget.maxIntegerBits < 1 || budget.maxOperations < 1 || !(budget.maxAbsoluteWidth > 0 && Number.isFinite(budget.maxAbsoluteWidth)))
      return result("invalid", "Finite nonempty powers, ordered finite endpoints and valid explicit budgets are required");
    const literalLower: Fraction = literalFraction(interval.start), literalUpper: Fraction = literalFraction(interval.end);
    const whole: Bracket = bracket(literalLower, literalUpper, false);
    if (coefficients.length > budget.maxCoefficientCount) {
      unresolved.push({ bracket: whole, distinctRootCount: null, reason: "maxCoefficientCount; input degree is uninspected", depth: 0 });
      degree = -2; return result("budget-exhausted", "maxCoefficientCount; no coefficient or root set was discarded");
    }
    if (!coefficients.every(Number.isFinite)) return result("invalid", "Every polynomial coefficient must be finite");
    while (degree >= 0 && coefficients[degree] === 0) degree--;
    if (degree < 0) return { ...result("flat", "The exact zero polynomial vanishes on the whole interval"), flatInterval: whole };
    if (degree === 0) { total = 0; return result("complete", "Nonzero constant polynomial"); }
    try {
      const lower: Fraction = fromDouble(interval.start, state), upper: Fraction = fromDouble(interval.end, state);
      if (degree > budget.maxDegree) throw new Limit("maxDegree");
      const polynomial: Polynomial = integerPowers(coefficients.slice(0, degree + 1), state);
      const repeated: Polynomial = gcd(polynomial, derivative(polynomial, state), state);
      const squareFree: Polynomial = divide(polynomial, repeated, state);
      const factors: Factor[] = [];
      let w: Polynomial = squareFree, g: Polynomial = repeated;
      for (let multiplicity: number = 1; w.length > 1; multiplicity++) {
        tick(state);
        const y: Polynomial = gcd(w, g, state), factor: Polynomial = divide(w, y, state);
        if (factor.length > 1) factors.push({ polynomial: factor, chain: sturm(factor, state), multiplicity });
        w = y; g = divide(g, y, state);
      }
      const chain: Polynomial[] = sturm(squareFree, state);
      const va: number = variation(chain, lower, state), vb: number = variation(chain, upper, state);
      const rootA: boolean = signAt(squareFree, lower, state) === 0;
      const rootB: boolean = signAt(squareFree, upper, state) === 0;
      const point: boolean = interval.start === interval.end;
      const inside: number = point ? 0 : va - vb - (rootB ? 1 : 0);
      total = inside + (rootA ? 1 : 0) + (!point && rootB ? 1 : 0);
      const endpoints: Root[] = [];
      if (rootA) endpoints.push(publish(lower, lower, "start", factors, polynomial, roots.length, state));
      if (!point && rootB) endpoints.push(publish(upper, upper, "end", factors, polynomial, endpoints.length, state));
      if (inside > 0) pending.push({ lower, upper, va, vb, rootB, count: inside, depth: 0 });
      roots.push(...endpoints); prepared = true;
      if (pending.length === 0) return result("complete", "All endpoint roots are exact rational points; no interior roots");
      const target: Fraction = fromDouble(budget.maxAbsoluteWidth, state);
      while (pending.length > 0) {
        active = pending.pop()!;
        if (active.count === 1 && narrow(active.lower, active.upper, target, state)) {
          const root: Root = publish(active.lower, active.upper, "interior", factors, polynomial, roots.length, state);
          roots.push(root); active = undefined; continue;
        }
        if (active.depth >= budget.maxDepth) {
          unresolved.push({ bracket: bracket(active.lower, active.upper, true), distinctRootCount: active.count, reason: "maxDepth", depth: active.depth });
          active = undefined; continue;
        }
        if (state.bisections >= budget.maxBisections) throw new Limit("maxBisections");
        const middle: Fraction = midpoint(active.lower, active.upper, state);
        const vm: number = variation(chain, middle, state);
        const isRoot: boolean = signAt(squareFree, middle, state) === 0;
        const left: number = active.va - vm - (isRoot ? 1 : 0);
        const right: number = vm - active.vb - (active.rootB ? 1 : 0);
        if (left < 0 || right < 0 || left + right + (isRoot ? 1 : 0) !== active.count)
          throw new Error("Exact Sturm partition invariant failed");
        const exact: Root | undefined = isRoot ? publish(middle, middle, "interior", factors, polynomial, roots.length, state) : undefined;
        state.bisections++;
        if (exact !== undefined) roots.push(exact);
        if (right > 0) pending.push({ lower: middle, upper: active.upper, va: vm, vb: active.vb, rootB: active.rootB, count: right, depth: active.depth + 1 });
        if (left > 0) pending.push({ lower: active.lower, upper: middle, va: active.va, vb: vm, rootB: isRoot, count: left, depth: active.depth + 1 });
        active = undefined;
      }
      return result(unresolved.length === 0 ? "complete" : "partial", "Exact binary64 coefficient polynomial; root representatives are rounded bracket midpoints");
    } catch (error) {
      const condition: string = error instanceof Error ? error.message : "Unknown exact arithmetic condition";
      if (prepared) {
        for (const work of [...(active === undefined ? [] : [active]), ...pending])
          unresolved.push({ bracket: bracket(work.lower, work.upper, true), distinctRootCount: work.count, reason: condition, depth: work.depth });
      } else if (whole !== undefined) unresolved.push({ bracket: whole, distinctRootCount: total, reason: condition, depth: 0 });
      return result(roots.length > 0 || !(error instanceof Limit) ? "partial" : "budget-exhausted", condition);
    }
  }

  type Polynomial = bigint[];
  interface Fraction { n: bigint; d: bigint }
  interface State { budget: Budget; operations: number; bisections: number; largestIntegerBits: number }
  interface Factor { polynomial: Polynomial; chain: Polynomial[]; multiplicity: number }
  interface Work { lower: Fraction; upper: Fraction; va: number; vb: number; rootB: boolean; count: number; depth: number }
  class Limit extends Error {}

  /** Charge bounded algebra work before computing another exact primitive. */
  function tick(state: State): void {
    if (state.operations >= state.budget.maxOperations) throw new Limit("maxOperations");
    state.operations++;
  }
  /** Admit exact integer size; an exhausted bound is reported without truncation. */
  function checked(value: bigint, state: State): bigint {
    const bits: number = value === 0n ? 0 : (value < 0n ? -value : value).toString(2).length;
    if (bits > state.budget.maxIntegerBits) throw new Limit("maxIntegerBits");
    state.largestIntegerBits = Math.max(state.largestIntegerBits, bits); return value;
  }
  /** IEEE-754 finite values are exact signed mantissa times a power of two. */
  function dyadic(value: number): { mantissa: bigint; exponent: number } {
    const data: DataView = new DataView(new ArrayBuffer(8)); data.setFloat64(0, value, false);
    const high: number = data.getUint32(0, false), low: number = data.getUint32(4, false);
    const exponent: number = (high >>> 20) & 2047;
    const fraction: bigint = (BigInt(high & 1048575) << 32n) + BigInt(low);
    const mantissa: bigint = exponent === 0 ? fraction : (1n << 52n) + fraction;
    return { mantissa: (high >>> 31) === 0 ? mantissa : -mantissa, exponent: exponent === 0 ? -1074 : exponent - 1075 };
  }
  /** Charge each decode before allocating its dyadic pair. A scalar minimum
   * scan avoids both uncharged eager passes and an engine argument-count limit.
   * The positive common power-of-two lift and content reduction preserve signs.
   */
  function integerPowers(values: readonly number[], state: State): Polynomial {
    const parts: Array<{ mantissa: bigint; exponent: number }> = [];
    let exponent: number = Infinity;
    for (const value of values) {
      tick(state); const part: { mantissa: bigint; exponent: number } = dyadic(value);
      parts.push(part); if (part.mantissa !== 0n && part.exponent < exponent) exponent = part.exponent;
    }
    const powers: Polynomial = [];
    for (const part of parts) {
      tick(state); powers.push(part.mantissa === 0n ? 0n : checked(part.mantissa << BigInt(part.exponent - exponent), state));
    }
    return primitive(powers, state);
  }
  /** Positive-content reduction preserves polynomial signs at every real point. */
  function primitive(value: Polynomial, state: State): Polynomial {
    const p: Polynomial = [...value]; while (p.length > 1 && p.at(-1) === 0n) p.pop();
    let content: bigint = 0n; for (const coefficient of p) content = integerGcd(content, coefficient, state);
    if (content === 0n) return [0n];
    return p.map((coefficient: bigint): bigint => { tick(state); return checked(coefficient / content, state); });
  }
  /** GCD and factors use a unique positive-leading primitive representative. */
  function canonical(value: Polynomial, state: State): Polynomial {
    const p: Polynomial = primitive(value, state); return p.at(-1)! < 0n ? p.map((v: bigint): bigint => -v) : p;
  }
  /** Integer Euclidean GCD removes positive content only. */
  function integerGcd(a: bigint, b: bigint, state: State): bigint {
    a = a < 0n ? -a : a; b = b < 0n ? -b : b;
    while (b !== 0n) { tick(state); const r: bigint = a % b; a = b; b = r; } return a;
  }
  /** Derivative retains every nonzero high-order exact integer coefficient. */
  function derivative(p: Polynomial, state: State): Polynomial {
    return p.length === 1 ? [0n] : primitive(p.slice(1).map((v: bigint, i: number): bigint => { tick(state); return checked(v * BigInt(i + 1), state); }), state);
  }
  /** Positive-leading-magnitude pseudo-division is a positive multiple of the
   * true rational remainder, even when the divisor's leading coefficient is negative.
   */
  function remainder(a: Polynomial, b: Polynomial, state: State): Polynomial {
    let r: Polynomial = [...a];
    const lead: bigint = b.at(-1)!; if (lead === 0n) throw new Error("Zero polynomial divisor");
    const magnitude: bigint = lead < 0n ? -lead : lead, sign: bigint = lead < 0n ? -1n : 1n;
    while (r.length >= b.length && !(r.length === 1 && r[0] === 0n)) {
      const offset: number = r.length - b.length, top: bigint = r.at(-1)! * sign;
      r = r.map((v: bigint): bigint => { tick(state); return checked(v * magnitude, state); });
      for (let i: number = 0; i < b.length; i++) { tick(state); r[i + offset] = checked(r[i + offset]! - checked(top * b[i]!, state), state); }
      r = primitive(r, state);
    }
    return r;
  }
  /** Primitive polynomial GCD over Q via exact positive-scaled remainders. */
  function gcd(a: Polynomial, b: Polynomial, state: State): Polynomial {
    let x: Polynomial = canonical(a, state), y: Polynomial = canonical(b, state);
    while (!(y.length === 1 && y[0] === 0n)) { const r: Polynomial = remainder(x, y, state); x = y; y = canonical(r, state); }
    return canonical(x, state);
  }
  /** Gauss's lemma makes a primitive exact factor quotient integral. */
  function divide(a: Polynomial, b: Polynomial, state: State): Polynomial {
    const r: Polynomial = [...a], q: Polynomial = new Array<bigint>(Math.max(1, a.length - b.length + 1)).fill(0n);
    while (r.length >= b.length && !(r.length === 1 && r[0] === 0n)) {
      tick(state); const shift: number = r.length - b.length, lead: bigint = b.at(-1)!;
      if (lead === 0n || r.at(-1)! % lead !== 0n) throw new Error("Nonintegral exact polynomial factor quotient");
      const factor: bigint = r.at(-1)! / lead; q[shift] = checked(factor, state);
      for (let i: number = 0; i < b.length; i++) { tick(state); r[i + shift] = checked(r[i + shift]! - checked(factor * b[i]!, state), state); }
      while (r.length > 1 && r.at(-1) === 0n) r.pop();
    }
    if (r.some((v: bigint): boolean => v !== 0n)) throw new Error("Nonzero exact polynomial factor remainder");
    return canonical(q, state);
  }
  /** Only positive rescaling is allowed inside the signed Sturm chain. */
  function sturm(p: Polynomial, state: State): Polynomial[] {
    const chain: Polynomial[] = [p, derivative(p, state)];
    while (chain.at(-1)!.length > 1) {
      const r: Polynomial = remainder(chain[chain.length - 2]!, chain.at(-1)!, state);
      if (r.length === 1 && r[0] === 0n) throw new Error("Sturm input is not square-free");
      chain.push(r.map((v: bigint): bigint => -v));
    }
    return chain;
  }
  /** Homogeneous Horner evaluation gives the exact sign at n/d with d positive. */
  function signAt(p: Polynomial, x: Fraction, state: State): number {
    let value: bigint = p.at(-1)!, power: bigint = 1n;
    for (let i: number = p.length - 2; i >= 0; i--) {
      tick(state); power = checked(power * x.d, state);
      value = checked(checked(value * x.n, state) + checked(p[i]! * power, state), state);
    }
    return value < 0n ? -1 : value > 0n ? 1 : 0;
  }
  /** At a root, skipping zeros gives the right-hand Sturm variation. */
  function variation(chain: Polynomial[], x: Fraction, state: State): number {
    let previous: number = 0, count: number = 0;
    for (const p of chain) { const sign: number = signAt(p, x, state); if (sign !== 0) { if (previous !== 0 && previous !== sign) count++; previous = sign; } }
    return count;
  }
  /** Reduce an exact finite binary64 coordinate to a dyadic fraction. */
  function fromDouble(value: number, state: State): Fraction {
    const exact: Fraction = literalFraction(value);
    return { n: checked(exact.n, state), d: checked(exact.d, state) };
  }
  /** Finite IEEE input endpoints need at most 1075 bits. Fixed-size admission
   * serialization runs before integer budgets so even a tiny budget retains
   * the exact unresolved interval; zero is represented directly as 0/1.
   */
  function literalFraction(value: number): Fraction {
    const part: { mantissa: bigint; exponent: number } = dyadic(value);
    if (part.mantissa === 0n) return { n: 0n, d: 1n };
    while (part.exponent < 0 && part.mantissa % 2n === 0n) { part.mantissa /= 2n; part.exponent++; }
    return { n: part.exponent >= 0 ? part.mantissa << BigInt(part.exponent) : part.mantissa,
      d: part.exponent >= 0 ? 1n : 1n << BigInt(-part.exponent) };
  }
  /** Positive denominator and exact GCD reduction; no decimal rounding. */
  function fraction(n: bigint, d: bigint, state: State): Fraction {
    const g: bigint = integerGcd(n, d, state); return { n: checked(n / g, state), d: checked(d / g, state) };
  }
  /** All endpoints are dyadic, so their larger denominator is a common multiple. */
  function midpoint(a: Fraction, b: Fraction, state: State): Fraction {
    tick(state); const d: bigint = a.d > b.d ? a.d : b.d;
    return fraction(checked(checked(a.n * (d / a.d), state) + checked(b.n * (d / b.d), state), state), checked(2n * d, state), state);
  }
  /** Exact width comparison uses the dyadic target only as a refinement bound. */
  function narrow(a: Fraction, b: Fraction, width: Fraction, state: State): boolean {
    tick(state); const d: bigint = a.d > b.d ? a.d : b.d;
    const n: bigint = checked(checked(b.n * (d / b.d), state) - checked(a.n * (d / a.d), state), state);
    return checked(n * width.d, state) <= checked(width.n * d, state);
  }
  /** Identify one factor using exact point signs or open-interval Sturm counts. */
  function publish(a: Fraction, b: Fraction, location: Root["location"], factors: Factor[], polynomial: Polynomial, count: number, state: State): Root {
    if (count >= state.budget.maxRoots) throw new Limit("maxRoots");
    const point: boolean = a.n === b.n && a.d === b.d;
    let multiplicity: number = 0;
    for (const factor of factors) {
      const owns: boolean = point ? signAt(factor.polynomial, a, state) === 0 :
        variation(factor.chain, a, state) - variation(factor.chain, b, state) - (signAt(factor.polynomial, b, state) === 0 ? 1 : 0) === 1;
      if (owns) { if (multiplicity !== 0) throw new Error("Multiple square-free factors own one isolated root"); multiplicity = factor.multiplicity; }
    }
    if (multiplicity === 0) throw new Error("An isolated root has no exact multiplicity factor");
    // Right of this root, P has the sign of its first nonzero derivative.
    // For an open bracket use the left germ at its upper endpoint, even when
    // that endpoint is a different excluded root. No numerical root sample is used.
    let differentiated: Polynomial = polynomial, sign: number = 0, order: number = 0;
    if (point) {
      for (; order < multiplicity; order++) differentiated = derivative(differentiated, state);
      sign = signAt(differentiated, a, state);
    } else {
      for (;;) {
        sign = signAt(differentiated, b, state);
        if (sign !== 0) { if (order % 2 === 1) sign = -sign; break; }
        if (differentiated.length === 1) throw new Error("Nonzero polynomial has a zero endpoint germ");
        differentiated = derivative(differentiated, state); order++;
      }
    }
    if (sign !== -1 && sign !== 1) throw new Error("Multiplicity derivative sign is unresolved");
    const leadingDerivativeSign: -1 | 1 = sign;
    const representative: Fraction = point ? a : midpoint(a, b, state);
    const approximation: number = rounded(representative, state);
    const represented: Fraction = fromDouble(approximation, state);
    const approximationInBracket: boolean = point ? compare(a, represented, state) === 0 : compare(a, represented, state) < 0 && compare(represented, b, state) < 0;
    return { bracket: bracket(a, b, !point), approximation, approximationInBracket, multiplicity, leadingDerivativeSign,
      orientation: multiplicity % 2 === 0 ? "tangent" : leadingDerivativeSign === 1 ? "increasing" : "decreasing",
      exactRational: point, location, targetWidthMet: true };
  }
  /** Serialization keeps exact endpoints; open brackets exclude separately owned roots. */
  function bracket(a: Fraction, b: Fraction, open: boolean): Bracket {
    return { lower: { numerator: a.n.toString(), denominator: a.d.toString() }, upper: { numerator: b.n.toString(), denominator: b.d.toString() }, lowerOpen: open, upperOpen: open };
  }
  /** Exact comparison of dyadic endpoints and binary64 representatives. */
  function compare(a: Fraction, b: Fraction, state: State): number {
    tick(state); const d: bigint = a.d > b.d ? a.d : b.d;
    const left: bigint = checked(a.n * (d / a.d), state), right: bigint = checked(b.n * (d / b.d), state);
    return left < right ? -1 : left > right ? 1 : 0;
  }
  /** Exact rational-to-binary64 nearest-even rounding, including subnormals
   * and signed underflow. Integer quotient/remainder chooses the significand;
   * DataView packs its exact bits without a second floating-point rounding.
   * Finite input interval bounds exclude a rounded overflow to infinity.
   */
  function rounded(x: Fraction, state: State): number {
    if (x.n === 0n) return 0;
    const n: bigint = x.n < 0n ? -x.n : x.n;
    let exponent: number = n.toString(2).length - x.d.toString(2).length;
    tick(state);
    if (exponent >= 0 ? n < checked(x.d << BigInt(exponent), state) : checked(n << BigInt(-exponent), state) < x.d) exponent--;
    const shift: number = exponent < -1022 ? 1074 : 52 - exponent;
    const numerator: bigint = shift >= 0 ? checked(n << BigInt(shift), state) : n;
    const denominator: bigint = shift >= 0 ? x.d : checked(x.d << BigInt(-shift), state);
    tick(state); let significand: bigint = numerator / denominator;
    tick(state); const remainder: bigint = numerator % denominator;
    tick(state); const twice: bigint = checked(2n * remainder, state);
    if (twice > denominator || (twice === denominator && significand % 2n !== 0n)) significand = checked(significand + 1n, state);
    let biased: number;
    if (exponent < -1022) biased = significand >= (1n << 52n) ? 1 : 0;
    else {
      if (significand === (1n << 53n)) { significand >>= 1n; exponent++; }
      if (exponent > 1023) throw new Error("Root representative rounds beyond the finite input interval");
      biased = exponent + 1023;
    }
    const fraction: bigint = biased === 0 ? significand : significand - (1n << 52n);
    const data: DataView = new DataView(new ArrayBuffer(8));
    data.setUint32(0, (x.n < 0n ? 2147483648 : 0) + biased * 1048576 + Number(fraction >> 32n), false);
    data.setUint32(4, Number(fraction & 4294967295n), false);
    return data.getFloat64(0, false);
  }
}
