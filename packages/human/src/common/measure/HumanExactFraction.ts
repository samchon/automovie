import { HumanBinary64Arithmetic } from "./HumanBinary64Arithmetic";
import type { IHumanExactFraction } from "./IHumanExactFraction";

/**
 * Exact rational operations retain represented inputs through polynomial construction. Binary64 decomposition and rounding reuse their existing bit-arithmetic owner; no anatomical tolerance enters these operations.
 *
 * @evidence contracts/common.md#principled-implementation Positive-denominator reduced BigInt fractions preserve represented coefficients exactly; Euclidean GCD owns normalization and shared binary64 methods own input decomposition/output rounding. Directly supplied fractions must respect the denominator contract.
 * @evidence contracts/common.md#clear-and-simple-design This static owner groups exact rational primitives and square-root bracketing without mixing source landmarks, anatomy or mesh sampling into arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no anatomical tolerance or fixture identity; denominator refusal is authoritative and integer normalization replaces no foreign method.
 * @evidence contracts/common.md#meaningful-documentation The class states exact polynomial construction and shared bit arithmetic; method comments describe sign normalization, zero-divisor refusal and binary64 bounds.
 * @evidence contracts/performance.md#efficient-algorithms Costs depend on integer bit widths, Euclidean reductions and divisions; sqrtBounds additionally depends on the number of adjacent-value corrections, which has no explicit iteration cap.
 * @evidence contracts/performance.md#reuse-equivalent-work All operations reuse create/GCD and the shared binary64 owner; caller-owned fractions are not mutated or stored as an identity-based cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The class retains no instance state; temporary BigInts and returned rational records are call-local/caller-owned, with magnitude set by inputs rather than an unbounded persistent table.
 */
export class HumanExactFraction {
  /**
   * Reduce a rational to a positive denominator; a zero denominator refuses.
   *
   * @evidence contracts/common.md#principled-implementation A nonzero denominator is made positive and numerator/denominator are divided by their Euclidean GCD, yielding a reduced exact rational including canonical zero; zero denominators refuse.
   * @evidence contracts/common.md#clear-and-simple-design Normalization stays in one constructor primitive so arithmetic and JSON persistence share denominator/sign semantics.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The denominator branch is the actual rational-domain boundary, with no tolerance, specimen allowance or alternate value replacing division by zero.
   * @evidence contracts/common.md#meaningful-documentation The comment gives positive-denominator reduction and the zero-denominator failure; IHumanExactFraction defines signed numerator and positive denominator.
   * @evidence contracts/performance.md#efficient-algorithms For B-bit numerator/denominator, Euclidean remainder iterations and final integer divisions dominate work; only one reduced result record is allocated.
   * @evidence contracts/performance.md#reuse-equivalent-work The GCD helper is reused by normalization, while no equivalent-output cache retains mutable caller records or changes failure effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources GCD intermediates are local, and a two-BigInt result transfers to the caller; failures retain no record, buffer, task or handle.
   */
  static create(
    numerator: bigint,
    denominator: bigint = 1n,
  ): IHumanExactFraction {
    if (denominator === 0n)
      throw new Error("An exact fraction needs a nonzero denominator.");
    if (denominator < 0n) {
      numerator = -numerator;
      denominator = -denominator;
    }
    const a: bigint = this.gcd(numerator, denominator);
    return { numerator: numerator / a, denominator: denominator / a };
  }

  /**
   * Convert a finite represented binary64 value to its exact rational value through the shared dyadic decomposition.
   *
   * @evidence contracts/common.md#principled-implementation Finite Number decomposition supplies an exact integer and power of two, then a shift places that power in numerator or denominator before canonical reduction; nonfinite input refusal comes from dyadic.
   * @evidence contracts/common.md#clear-and-simple-design The method adapts represented Number inputs to the fraction owner, leaving binary64 field decoding with HumanBinary64Arithmetic.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No decimal reconstruction, numerical epsilon or measured anatomical expectation replaces the actual represented binary64 value.
   * @evidence contracts/common.md#meaningful-documentation The comment specifies finite represented-input conversion through shared dyadic decomposition, preserving exact rather than decimal identity.
   * @evidence contracts/performance.md#efficient-algorithms Fixed-width decomposition followed by bounded binary64 exponent shifting and GCD reduction costs integer work on at most the represented Number magnitude.
   * @evidence contracts/performance.md#reuse-equivalent-work The canonical dyadic decoder and create normalizer are reused; no repeated input cache is needed for this pure conversion.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The tuple and shifted integers are temporary; only the normalized fraction escapes to the caller, without retained views or resources.
   */
  static from(value: number): IHumanExactFraction {
    const [n, power]: [bigint, number] = HumanBinary64Arithmetic.dyadic(value);
    return power >= 0
      ? this.create(n << BigInt(power))
      : this.create(n, 1n << BigInt(-power));
  }

  /**
   * Add exact rational values without rounded intermediates.
   *
   * @evidence contracts/common.md#principled-implementation Equal denominators add numerators directly; otherwise denominator GCD determines the least-common-denominator factors before exact addition and canonical reduction. Inputs follow the positive-denominator fraction contract.
   * @evidence contracts/common.md#clear-and-simple-design Denominator factoring and final create normalization stay together in the scalar addition primitive.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Equality is an arithmetic equivalence branch, not a specimen shortcut, and no rounded Number intermediate or expected sum enters the operation.
   * @evidence contracts/common.md#meaningful-documentation The public comment identifies exact addition; parameter/result types retain signed numerators and positive denominators.
   * @evidence contracts/performance.md#efficient-algorithms GCD, reduced-denominator multiplications and final reduction dominate bit-width-dependent work; factoring avoids forming an unnecessarily large full denominator product.
   * @evidence contracts/performance.md#reuse-equivalent-work The denominator GCD is computed once and reused for both factors; create supplies the shared reduced-output rule without a cross-call sum cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only a few factor/product BigInts and the returned fraction are owned locally; inputs remain borrowed and no persistent storage or tasks grow.
   */
  static add(
    a: IHumanExactFraction,
    b: IHumanExactFraction,
  ): IHumanExactFraction {
    if (a.denominator === b.denominator)
      return this.create(a.numerator + b.numerator, a.denominator);
    const common: bigint = this.gcd(a.denominator, b.denominator);
    const left: bigint = a.denominator / common;
    const right: bigint = b.denominator / common;
    return this.create(
      a.numerator * right + b.numerator * left,
      left * b.denominator,
    );
  }

  /**
   * Subtract exact rationals without a rounded intermediate value.
   *
   * @evidence contracts/common.md#principled-implementation Exact subtraction is addition of a normalized negated rational, preserving integer arithmetic and the denominator-domain requirements of those canonical primitives.
   * @evidence contracts/common.md#clear-and-simple-design The method delegates sign reversal and denominator combination rather than maintaining a second addition algorithm.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No binary64 intermediate, tolerance or consumer-specific branch adjusts the subtraction result.
   * @evidence contracts/common.md#meaningful-documentation The comment states exact subtraction without rounded intermediates, and the fraction type retains its denominator contract.
   * @evidence contracts/performance.md#efficient-algorithms Work consists of negate/create plus add/create GCD and integer operations, so supplied bit widths dominate; the composed normalizations remain part of this owner's cost.
   * @evidence contracts/performance.md#reuse-equivalent-work Negation and addition reuse the existing arithmetic owners; no cross-request cache or shared mutable result is introduced.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary negated record and addition intermediates are call-local, and only the final fraction transfers to the caller.
   */
  static subtract(
    a: IHumanExactFraction,
    b: IHumanExactFraction,
  ): IHumanExactFraction {
    return this.add(a, this.negate(b));
  }

  /**
   * Negate an exact rational while retaining its normalized denominator.
   *
   * @evidence contracts/common.md#principled-implementation Negating the integer numerator and passing through create retains exact sign reversal and a normalized positive denominator for valid fractions.
   * @evidence contracts/common.md#clear-and-simple-design One delegation exposes sign reversal without duplicating normalization rules.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no floating sign approximation or special anatomical sign convention; denominator refusal stays with create.
   * @evidence contracts/common.md#meaningful-documentation The public comment gives numerator sign reversal and retained normalized denominator, including the result's fraction representation.
   * @evidence contracts/performance.md#efficient-algorithms A BigInt negation and GCD normalization use input-bit-width-dependent work, with one small result record.
   * @evidence contracts/performance.md#reuse-equivalent-work Canonical create normalization is reused rather than assuming directly supplied fractions were already reduced; no result cache coordinates this pure scalar operation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The negated BigInt and GCD temporaries belong to the call, and the returned fraction has no associated handles or tasks.
   */
  static negate(a: IHumanExactFraction): IHumanExactFraction {
    return this.create(-a.numerator, a.denominator);
  }

  /**
   * Multiply exact rational values with cross cancellation before the integer products.
   *
   * @evidence contracts/common.md#principled-implementation Cross-cancel numerator/denominator pairs by GCD before multiplying and normalize the product; a zero input denominator reaches create's refusal rather than being hidden. Valid inputs use positive denominators.
   * @evidence contracts/common.md#clear-and-simple-design Cross cancellation belongs to exact multiplication, with final sign/reduction authority kept in create.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The zero-denominator path preserves the rational-domain error; no approximate product, numeric target or foreign implementation is substituted.
   * @evidence contracts/common.md#meaningful-documentation The public comment identifies exact rational multiplication, and the implementation retains authoritative invalid-denominator refusal.
   * @evidence contracts/performance.md#efficient-algorithms Two cross GCDs, smaller integer products and final reduction dominate bit-width-dependent work; cancellation avoids unnecessary intermediate growth.
   * @evidence contracts/performance.md#reuse-equivalent-work Each cross GCD is computed once for its numerator/denominator pair, then create reuses the common output normalization.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Cross factors and product BigInts are local; the output transfers to the caller while input records remain unchanged, with no retained multiplication table.
   */
  static multiply(
    a: IHumanExactFraction,
    b: IHumanExactFraction,
  ): IHumanExactFraction {
    if (a.denominator === 0n || b.denominator === 0n)
      return this.create(a.numerator * b.numerator, 0n);
    const left: bigint = this.gcd(a.numerator, b.denominator);
    const right: bigint = this.gcd(b.numerator, a.denominator);
    return this.create(
      (a.numerator / left) * (b.numerator / right),
      (a.denominator / right) * (b.denominator / left),
    );
  }

  /**
   * Divide exact rationals; a zero divisor reaches the shared denominator refusal.
   *
   * @evidence contracts/common.md#principled-implementation Multiplication by the divisor's reciprocal implements exact rational division; a zero divisor creates a zero denominator and reaches the shared refusal, while create normalizes reciprocal signs.
   * @evidence contracts/common.md#clear-and-simple-design Division uses multiplication's cancellation and normalization instead of another rational product implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No zero divisor receives a fabricated value or epsilon adjustment, and no consumer exception bypasses denominator refusal.
   * @evidence contracts/common.md#meaningful-documentation The comment describes reciprocal exact division and the zero-divisor failure through the canonical denominator check.
   * @evidence contracts/performance.md#efficient-algorithms A reciprocal record plus multiply's GCD/product/reduction work scales with input bit widths; delegation does not remove those costs.
   * @evidence contracts/performance.md#reuse-equivalent-work The existing multiply and create owners are reused, with no repeated-division cache keyed by mutable fraction objects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The reciprocal record and arithmetic temporaries are call-local; only the result fraction transfers, with no handles, tasks or persistent buffers.
   */
  static divide(
    a: IHumanExactFraction,
    b: IHumanExactFraction,
  ): IHumanExactFraction {
    return this.multiply(a, {
      numerator: b.denominator,
      denominator: b.numerator,
    });
  }

  /**
   * Euclid's remainder recurrence over absolute BigInts returns a nonnegative common divisor for sign-independent cancellation and normalization. Final create normalization remains authoritative, including directly constructed unreduced values and the original denominator refusal; no anatomical tolerance, expected answer or foreign method replacement enters this private integer operation.
   *
   * Remainder iterations depend on integer bit widths and Euclidean reduction length. Construction, addition and multiplication reuse this helper; its two working integers remain invocation-local and only the scalar divisor escapes, with no argument cache, persistent resource or pending operation.
   */
  private static gcd(a: bigint, b: bigint): bigint {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b !== 0n) [a, b] = [b, a % b];
    return a;
  }

  /**
   * Convert an exact positive-denominator rational through shared nearest-even binary64 rounding.
   *
   * @evidence contracts/common.md#principled-implementation The signed numerator and positive denominator are converted by the canonical nearest-even binary64 rational converter, retaining that owner's subnormal and range limits.
   * @evidence contracts/common.md#clear-and-simple-design This adapter owns only the fraction-to-Number boundary, leaving bit-grid rounding with HumanBinary64Arithmetic.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No decimal intermediate or anatomical accuracy epsilon modifies the represented result.
   * @evidence contracts/common.md#meaningful-documentation The comment specifies positive-denominator rational conversion and shared nearest-even rounding, rather than promising exact Number representation for every fraction.
   * @evidence contracts/performance.md#efficient-algorithms The delegated binade/shift/division cost scales with integer bit widths; the wrapper adds constant work and no second numeric traversal.
   * @evidence contracts/performance.md#reuse-equivalent-work The common numberAt owner is reused by all fraction consumers and no repeated conversion cache assumes a fraction object stays unchanged.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains no fraction record; delegated strings/BigInts are call-local and only the Number result transfers to the caller.
   */
  static number(a: IHumanExactFraction): number {
    return HumanBinary64Arithmetic.numberAt(a.numerator, a.denominator);
  }

  /**
   * Compare rational cross-products exactly and return their order without converting to binary64.
   *
   * @evidence contracts/common.md#principled-implementation Signed cross-product difference orders positive-denominator rationals exactly, without a binary64 conversion; zero difference yields equality for unreduced but equivalent valid fractions.
   * @evidence contracts/common.md#clear-and-simple-design The scalar comparison keeps exact ordering separate from output rounding and search policy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No epsilon or expected root ordering changes the sign decision, and no foreign comparison method is replaced.
   * @evidence contracts/common.md#meaningful-documentation The comment states exact cross-products and no Number conversion; the return expression gives negative, zero or positive order.
   * @evidence contracts/performance.md#efficient-algorithms Two BigInt products and one difference dominate bit-width-dependent work; no denominator normalization or geometry scan is necessary solely to compare signs.
   * @evidence contracts/performance.md#reuse-equivalent-work The single difference is reused for both sign decisions, with no cached order between mutable input records.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only local product/difference BigInts are retained during the call, and a small numeric order escapes without handles or tasks.
   */
  static compare(a: IHumanExactFraction, b: IHumanExactFraction): number {
    const difference: bigint =
      a.numerator * b.denominator - b.numerator * a.denominator;
    return difference < 0n ? -1 : difference > 0n ? 1 : 0;
  }

  /** Binary64 lower and upper bounds whose squares bracket the exact value.
   *
   * @evidence contracts/common.md#principled-implementation A nonnegative exact rational is rescaled by an even binary exponent, seeded by Math.sqrt, and adjusted with adjacent binary64 values until exact square comparisons bracket it; negative inputs and unrepresentable initial magnitude refuse. Positive denominator remains the fraction premise.
   * @evidence contracts/common.md#clear-and-simple-design Root bracketing stays in the exact fraction owner, reusing exact square/compare and shared nextUp/nextDown instead of anatomical tolerance bounds.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero is an exact arithmetic boundary; adjacent-value corrections use no iteration cap, epsilon or specimen-specific expected length.
   * @evidence contracts/common.md#meaningful-documentation The method comment states binary64 bounds whose squares bracket the value, and errors expose negative squared metrics or excessive represented magnitude.
   * @evidence contracts/performance.md#efficient-algorithms Bit-width-dependent rational operations dominate each adjustment, multiplied by the number of adjacent-value corrections; there is no explicit bound on correction iterations.
   * @evidence contracts/performance.md#reuse-equivalent-work The scaled rational and exponent are computed once; each candidate square reuses from/multiply/compare semantics without a cross-input root cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Scaled fractions and correction intermediates are call-local and only two Number bounds transfer to the caller, with no retained search task or numeric registry.
   */
  static sqrtBounds(a: IHumanExactFraction): [number, number] {
    if (a.numerator < 0n)
      throw new Error("A squared metric cannot be negative.");
    if (a.numerator === 0n) return [0, 0];
    let exponent: number =
      a.numerator.toString(2).length - a.denominator.toString(2).length;
    if (
      exponent >= 0
        ? a.numerator < a.denominator << BigInt(exponent)
        : a.numerator << BigInt(-exponent) < a.denominator
    )
      exponent--;
    const power: number = Math.floor(exponent / 2);
    const reduced: IHumanExactFraction =
      power >= 0
        ? this.create(a.numerator, a.denominator << BigInt(2 * power))
        : this.create(a.numerator << BigInt(-2 * power), a.denominator);
    let lower: number = Math.sqrt(this.number(reduced)) * 2 ** power;
    if (!Number.isFinite(lower))
      throw new Error("Metric magnitude exceeds binary64 coordinates.");
    const square: (value: number) => IHumanExactFraction = (
      value: number,
    ): IHumanExactFraction => this.multiply(this.from(value), this.from(value));
    while (this.compare(square(lower), a) > 0)
      lower = HumanBinary64Arithmetic.nextDown(lower);
    let upper: number = HumanBinary64Arithmetic.nextUp(lower);
    while (Number.isFinite(upper) && this.compare(square(upper), a) < 0) {
      lower = upper;
      upper = HumanBinary64Arithmetic.nextUp(upper);
    }
    return this.compare(square(lower), a) === 0
      ? [lower, lower]
      : [lower, upper];
  }
}
