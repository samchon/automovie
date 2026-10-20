/**
 * Exact normalized boundary phases and atomic interval incidence in binary64.
 * Phase keys preserve the exact dyadic affine combination before display rounding.
 * Authority IDs belong to partition and its caller; phase/local carry no such ID.
 * No position, normal, source topology or generated geometry enters this helper.
 *
 * @evidence contracts/common.md#principled-implementation Exact integer dyadics identify affine phases; rational nearest-even rounding supplies numeric views. An endpoint sweep reports incidence separately on each authority's open atoms.
 * @evidence contracts/common.md#clear-and-simple-design One stateless namespace owns phase identity, inverse coordinates and interval incidence; geometry and authority admission remain caller responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance, positional weld, hidden phase correction or geometric nonmanifold inference is used.
 * @evidence contracts/common.md#meaningful-documentation Documents normalized units, exact versus rounded identity, oriented walks, explicit gaps and the missing authority channel in phase/local.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A namespace performs no computation; its functions state their costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The namespace holds no result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No namespace state or native resource is retained.
 */
export namespace AutoMovieCanonicalBoundary64 {
  /**
   * One authority's directed normalized interval; finite endpoints lie in [0,1]
   * and differ. Authority is a nonempty caller-owned identity, not a position.
   *
   * @evidence contracts/common.md#principled-implementation Two normalized endpoints describe an oriented restriction of one named boundary.
   * @evidence contracts/common.md#clear-and-simple-design This structural record separates authority identity from phase arithmetic.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Numeric coincidence supplies no authority identity.
   * @evidence contracts/common.md#meaningful-documentation States endpoint range, directed order and caller-owned identity.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A type performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type schedules no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A type owns no runtime storage.
   */
  export type Interval = {
    /** Nonempty caller-owned boundary identity, independent of numeric coincidence. */
    authority: string;

    /** Finite initial canonical phase in [0,1]; directed order is preserved. */
    start: number;

    /** Finite terminal canonical phase in [0,1], distinct from start. */
    end: number;
  };

  /**
   * An integer times a power of two, normalized to an odd numerator or zero.
   * This private pair represents binary64 inputs and their affine products
   * exactly for addition, canonical keys and rational inversion.
   */
  type Dyadic = { n: bigint; e: number };

  /**
   * Evaluate (1-t)start+t end exactly for finite normalized binary64 inputs.
   * The key is `d:<odd hexadecimal numerator>p<binary exponent>`; zero is d:0p0.
   * The numeric view is rounded once to nearest, ties to even. Endpoints retain
   * their input value, including signed zero; interior numeric views may round
   * onto an endpoint while their exact key remains distinct. Inputs are immutable.
   *
   * @evidence contracts/common.md#principled-implementation Binary64 decoding, exact aligned subtraction and integer multiplication compute the affine dyadic; integer quotient/remainder rounding implements nearest-even.
   * @evidence contracts/common.md#clear-and-simple-design One exact result supplies both identity and its numeric view; endpoint authority is retained directly.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No rounded subtraction, decimal identity, phase clamp or epsilon comparison changes the exact affine result.
   * @evidence contracts/common.md#meaningful-documentation States key encoding, normalized inputs, signed-zero endpoints and possible rounded endpoint coincidence.
   * @evidence contracts/performance.md#efficient-algorithms A fixed number of BigInt shifts, products and divisions operate on O(W) bits, W at most 2149 for binary64 affine phases; normalization visits trailing zero bits and key formatting visits result bits.
   * @evidence contracts/performance.md#reuse-equivalent-work The same normalized exact result supplies the key and rounded value.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar/string result escapes; DataViews and BigInts are call-local and no cache or native handle is acquired.
   */
  export function phase(
    start: number,
    end: number,
    t: number,
  ): { value: number; key: string } {
    admit(start, end);
    unit(t);
    const a: Dyadic = decode(start),
      b: Dyadic = decode(end),
      fraction: Dyadic = decode(t),
      delta: Dyadic = subtract(b, a);
    // a+t(b-a) is the affine combination with exact integer subtraction.
    const q: Dyadic = subtract(a, {
      n: -delta.n * fraction.n,
      e: delta.e + fraction.e,
    });
    return {
      value: t === 0 ? start : t === 1 ? end : rounded(q.n, 1n, q.e),
      key: encode(q),
    };
  }

  /**
   * Invert an exact phase key within a directed normalized interval.
   * Key/value disagreement, noncanonical keys, phases outside the exact interval
   * and an interior inverse rounded to 0 or 1 throw. Exact endpoints return 0/1.
   * Authority IDs are absent from this ABI and must be checked by the caller.
   * An interior numeric phase coinciding with an endpoint remains valid when its
   * key distinguishes it and the inverse coordinate is representably interior.
   * A rounded inverse need not reproduce that key through phase; retain the
   * canonical input key across restrictions rather than reconstructing identity.
   *
   * @evidence contracts/common.md#principled-implementation Exact dyadic subtraction forms (q-start)/(end-start); integer rational rounding preserves endpoint tests before numeric conversion.
   * @evidence contracts/common.md#clear-and-simple-design Exact-key admission precedes interval admission and one inverse rounding; authority selection stays outside the numeric ABI.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No numeric reconstruction from rounded q, clamping, tolerance or authority inference substitutes for the supplied key.
   * @evidence contracts/common.md#meaningful-documentation States exact range checking, endpoint collapse refusal, numeric/key consistency and caller authority responsibility.
   * @evidence contracts/performance.md#efficient-algorithms Key parsing visits at most 550 characters; fixed aligned BigInt operations and one rational division process O(W) bits from bounded binary64 phase keys.
   * @evidence contracts/performance.md#reuse-equivalent-work Parsed exact q serves consistency, range and inverse checks without another interpolation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the inverse scalar escapes; key parsing and rational buffers are call-local with no retained cache or handles.
   */
  export function local(
    start: number,
    end: number,
    q: { value: number; key: string },
  ): number {
    admit(start, end);
    unit(q.value);
    const exact: Dyadic = parse(q.key);
    if (q.value !== rounded(exact.n, 1n, exact.e))
      throw new Error("Canonical phase key and numeric value disagree");
    const numerator: Dyadic = subtract(exact, decode(start)),
      denominator: Dyadic = subtract(decode(end), decode(start));
    const direction: bigint = denominator.n < 0n ? -1n : 1n;
    if (
      numerator.n * direction < 0n ||
      subtract(denominator, numerator).n * direction < 0n
    )
      throw new Error("Canonical phase is outside the directed interval");
    if (numerator.n === 0n) return 0;
    if (subtract(denominator, numerator).n === 0n) return 1;
    const value: number = rounded(
      numerator.n * direction,
      denominator.n * direction,
      numerator.e - denominator.e,
    );
    if (!(value > 0 && value < 1))
      throw new Error(
        "Interior canonical phase inverse collapses to an endpoint",
      );
    return value;
  }

  /**
   * Order admitted exact phase keys without using their rounded numeric views.
   * Distinct dyadics can have the same view; their identity and order remain distinct.
   *
   * @evidence contracts/common.md#principled-implementation Validated dyadics are aligned and subtracted exactly before taking their sign.
   * @evidence contracts/common.md#clear-and-simple-design One scalar comparison serves schedule sorting and directed interval membership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rounded-value coincidence does not merge or reorder canonical addresses.
   * @evidence contracts/common.md#meaningful-documentation States exact-key ordering and the distinction from numeric views.
   * @evidence contracts/performance.md#efficient-algorithms Two bounded key parses and O(W)-bit aligned subtraction determine one sign.
   * @evidence contracts/performance.md#reuse-equivalent-work Each key is parsed once per comparison.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only a signed scalar escapes; parsed BigInts are call-local.
   */
  export function compare(
    a: { value: number; key: string },
    b: { value: number; key: string },
  ): -1 | 0 | 1 {
    const x: Dyadic = parse(a.key),
      y: Dyadic = parse(b.key);
    if (a.value !== rounded(x.n, 1n, x.e) || b.value !== rounded(y.n, 1n, y.e))
      throw new Error("Canonical phase key and numeric value disagree");
    const difference: bigint = subtract(x, y).n;
    return difference < 0n ? -1 : difference > 0n ? 1 : 0;
  }

  /**
   * Invert the supplied finite monotone map between its authored local anchors.
   * Anchors include local 0 and 1 in increasing local order; their exact phases
   * are strictly directed. Exact authored addresses retain their original local.
   * Foreign phases are bracketed by those anchors and bisected in ordered positive
   * binary64 bits until an exact hit or adjacent representable locals remain.
   * An unattainable phase returns an interior bracketing local, with its original
   * canonical identity retained by the caller. No continuous inverse is certified.
   * A reversed map, inconsistent anchor, out-of-range target or unrepresentable
   * interior inverse throws rather than moving an authored local coordinate.
   *
   * @evidence contracts/common.md#principled-implementation Exact phase comparisons bracket the same callback used for forward transport; ordered IEEE bit bisection terminates on its finite local domain.
   * @evidence contracts/common.md#clear-and-simple-design One forward callback and its immutable authored anchors define both transports, avoiding an independently rounded inverse formula.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No phase epsilon, coordinate rounding, shape resampling, special address override or endpoint clamp changes canonical identity or authored locals.
   * @evidence contracts/common.md#meaningful-documentation States directed anchors, finite inverse semantics, unattainable phases and explicit refusal cases.
   * @evidence contracts/performance.md#efficient-algorithms A anchors cost O(A) forward evaluations and exact comparisons; at most 62 additional callback evaluations bisect the positive unit binary64 bit range, in addition to caller callback cost.
   * @evidence contracts/performance.md#reuse-equivalent-work Caller-owned forward anchors are reused for interval selection and exact authored hits; each bisection evaluates its midpoint once.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only one local scalar escapes; the fixed eight-byte DataView and phase brackets are call-local, with no retained callback or cache.
   */
  export function inverse(
    forward: (local: number) => ReturnType<typeof phase>,
    target: ReturnType<typeof phase>,
    anchors: readonly { local: number; phase: ReturnType<typeof phase> }[],
  ): number {
    if (
      anchors.length < 2 ||
      anchors[0]!.local !== 0 ||
      anchors[anchors.length - 1]!.local !== 1
    )
      throw new Error("A finite inverse requires complete local anchors");
    const direction: number = compare(
      anchors[anchors.length - 1]!.phase,
      anchors[0]!.phase,
    );
    if (direction === 0)
      throw new Error("Finite inverse endpoints must differ");
    let bracket: number = -1,
      authoredHit: number | undefined;
    for (let i: number = 0; i < anchors.length; ++i) {
      const anchor: (typeof anchors)[number] = anchors[i]!;
      unit(anchor.local);
      if (compare(forward(anchor.local), anchor.phase) !== 0)
        throw new Error("Finite inverse anchor disagrees with its forward map");
      if (
        i > 0 &&
        (anchor.local <= anchors[i - 1]!.local ||
          compare(anchor.phase, anchors[i - 1]!.phase) * direction <= 0)
      )
        throw new Error("Finite inverse anchors must be strictly directed");
      const relation: number = compare(target, anchor.phase) * direction;
      if (relation === 0) authoredHit = anchor.local;
      if (relation > 0) bracket = i;
    }
    if (authoredHit !== undefined) return authoredHit;
    if (bracket < 0 || bracket + 1 >= anchors.length)
      throw new Error("Finite inverse target is outside its anchors");
    const first: (typeof anchors)[number] = anchors[bracket]!,
      last: (typeof anchors)[number] = anchors[bracket + 1]!;
    const view: DataView = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, first.local === 0 ? 0 : first.local, false);
    let low: bigint = view.getBigUint64(0, false);
    view.setFloat64(0, last.local, false);
    let high: bigint = view.getBigUint64(0, false);
    let loPhase: ReturnType<typeof phase> = first.phase,
      hiPhase: ReturnType<typeof phase> = last.phase;
    while (high - low > 1n) {
      const middle: bigint = (low + high) >> 1n;
      view.setBigUint64(0, middle, false);
      const local: number = view.getFloat64(0, false),
        mapped: ReturnType<typeof phase> = forward(local);
      if (
        compare(mapped, loPhase) * direction < 0 ||
        compare(mapped, hiPhase) * direction > 0
      )
        throw new Error(
          "Finite forward map reverses inside its inverse bracket",
        );
      const relation: number = compare(mapped, target) * direction;
      if (relation === 0) return local;
      if (relation < 0) {
        low = middle;
        loPhase = mapped;
      } else {
        high = middle;
        hiPhase = mapped;
      }
    }
    view.setBigUint64(0, low, false);
    const lo: number = view.getFloat64(0, false);
    view.setBigUint64(0, high, false);
    const hi: number = view.getFloat64(0, false);
    if (lo > first.local && lo < last.local) return lo;
    if (hi > first.local && hi < last.local) return hi;
    throw new Error(
      "Finite inverse has no representable interior local coordinate",
    );
  }

  /**
   * Partition each named authority at all declared binary64 endpoints.
   * Returned atoms are increasing open intervals, sorted by authority and start;
   * IDs within an atom are sorted. Input walk is the patch's coherent boundary
   * walk relative to increasing local side parameter (+1 bottom/right, -1 top/left).
   * Output walks multiply that sign by sign(end-start), so all use the increasing
   * canonical atom direction. Empty coverage and conflicting/overfull incidence
   * remain explicit diagnostics; they neither throw nor certify source topology.
   * Three global uses can describe coarse1+fine2 with exactly two uses per atom.
   * Duplicate IDs, empty authority/ID, invalid walks and invalid intervals throw.
   *
   * @evidence contracts/common.md#principled-implementation An endpoint event sweep admits exact numeric endpoint order and records the active uses on each open atomic interval, with directed local-to-canonical transport.
   * @evidence contracts/common.md#clear-and-simple-design Authority grouping, endpoint events and atom publication separate identity, interval coverage and caller topology decisions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate matching, interval epsilon, global incident-count shortcut or hidden gap removal changes declared coverage.
   * @evidence contracts/common.md#meaningful-documentation States open atoms, deterministic order, input/output walk frames, gap semantics and the limited meaning of incidence diagnostics.
   * @evidence contracts/performance.md#efficient-algorithms For U uses and A atoms, sorting events costs O(U log U) comparisons; sorting each atom's M active IDs costs O(M log M), with O(U+sum M) storage including returned coverage. String comparison visits key bytes; explicit multiplicity can make output quadratic.
   * @evidence contracts/performance.md#reuse-equivalent-work One endpoint event map and active-use map per authority serve every atom without rescanning all input intervals.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local maps expire on return or failure; returned atoms/diagnostics scale with declared interval incidences and are caller-owned, with no global cache or native resource.
   */
  export function partition(
    uses: readonly {
      id: string;
      authority: string;
      start: number;
      end: number;
      walk: 1 | -1;
    }[],
  ): {
    atoms: {
      authority: string;
      start: number;
      end: number;
      uses: string[];
      walks: (1 | -1)[];
    }[];
    diagnostics: string[];
  } {
    const ids: Set<string> = new Set(),
      groups: Map<
        string,
        Map<number, { add: { id: string; walk: 1 | -1 }[]; remove: string[] }>
      > = new Map();
    for (const use of uses) {
      admit(use.start, use.end);
      if (
        typeof use.id !== "string" ||
        !use.id ||
        ids.has(use.id) ||
        typeof use.authority !== "string" ||
        !use.authority ||
        (use.walk !== 1 && use.walk !== -1)
      )
        throw new Error(
          "Boundary uses require unique nonempty IDs, authority and signed walks",
        );
      ids.add(use.id);
      const events: Map<
        number,
        { add: { id: string; walk: 1 | -1 }[]; remove: string[] }
      > = groups.get(use.authority) ?? new Map();
      groups.set(use.authority, events);
      const lo: number = Math.min(use.start, use.end),
        hi: number = Math.max(use.start, use.end);
      for (const value of [lo, hi])
        if (!events.has(value)) events.set(value, { add: [], remove: [] });
      events.get(lo)!.add.push({
        id: use.id,
        walk: (use.walk * (use.end > use.start ? 1 : -1)) as 1 | -1,
      });
      events.get(hi)!.remove.push(use.id);
    }
    const atoms: ReturnType<typeof partition>["atoms"] = [],
      diagnostics: string[] = [];
    for (const authority of [...groups.keys()].sort(lexical)) {
      const events: NonNullable<ReturnType<typeof groups.get>> =
          groups.get(authority)!,
        endpoints: number[] = [...events.keys()].sort(
          (a: number, b: number): number => (a < b ? -1 : a > b ? 1 : 0),
        ),
        active: Map<string, 1 | -1> = new Map();
      for (let i: number = 0; i + 1 < endpoints.length; i++) {
        const start: number = endpoints[i]!,
          end: number = endpoints[i + 1]!,
          event: NonNullable<ReturnType<typeof events.get>> =
            events.get(start)!;
        for (const id of event.remove) active.delete(id);
        for (const use of event.add) active.set(use.id, use.walk);
        const members: string[] = [...active.keys()].sort(lexical),
          walks: (1 | -1)[] = members.map(
            (id: string): 1 | -1 => active.get(id)!,
          );
        atoms.push({ authority, start, end, uses: members, walks });
        if (!members.length)
          diagnostics.push(
            `Uncovered boundary atom ${JSON.stringify(authority)} [${start},${end}]`,
          );
        else if (members.length > 2)
          diagnostics.push(
            `Overfull declared boundary atom ${JSON.stringify(authority)} [${start},${end}]: ${members.length} uses`,
          );
        else if (members.length === 2 && walks[0] === walks[1])
          diagnostics.push(
            `Equal directed walks on boundary atom ${JSON.stringify(authority)} [${start},${end}]`,
          );
      }
    }
    return { atoms, diagnostics };
  }

  /**
   * Admit exactly the finite normalized scalar domain with constant scalar
   * comparisons. Invalid values throw; no clamp or epsilon broadens admission.
   */
  function unit(value: number): void {
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new Error("Boundary phases must be finite in [0,1]");
  }

  /**
   * Distinct admitted endpoints define an invertible directed affine interval.
   * Two scalar admissions and one equality refuse invalid or equal endpoints
   * without perturbing either endpoint or acquiring retained state.
   */
  function admit(start: number, end: number): void {
    unit(start);
    unit(end);
    if (start === end)
      throw new Error("Boundary interval endpoints must differ");
  }

  /**
   * Remove factors of two without rounding to give signed dyadics one identity:
   * zero has one representation and every nonzero numerator is odd. At most W
   * trailing-zero shifts process O(W)-bit integers; only the new pair escapes.
   */
  function normalize(n: bigint, e: number): Dyadic {
    if (n === 0n) return { n: 0n, e: 0 };
    while ((n & 1n) === 0n) {
      n >>= 1n;
      e++;
    }
    return { n, e };
  }

  /**
   * Decode the admitted nonnegative IEEE binary64 exponent and significand
   * exactly, identifying both signed zeros mathematically. The fixed eight-byte
   * DataView and bounded significand normalization are invocation-local; no
   * decimal conversion, rounded arithmetic or shared state derives the dyadic.
   */
  function decode(value: number): Dyadic {
    const view: DataView = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, value, false);
    const bits: bigint = view.getBigUint64(0, false),
      exponent: number = Number((bits >> 52n) & 2047n),
      fraction: bigint = bits & ((1n << 52n) - 1n);
    return normalize(
      exponent === 0 ? fraction : fraction + (1n << 52n),
      exponent === 0 ? -1074 : exponent - 1075,
    );
  }

  /**
   * Align to a common power of two and return the normalized signed difference.
   * Two O(W)-bit shifts and integer subtraction avoid binary64 cancellation;
   * the new pair serves affine arithmetic, range tests and inversion without
   * mutating or retaining either input.
   */
  function subtract(a: Dyadic, b: Dyadic): Dyadic {
    const e: number = Math.min(a.e, b.e);
    return normalize((a.n << BigInt(a.e - e)) - (b.n << BigInt(b.e - e)), e);
  }

  /**
   * Encode the normalized nonnegative numerator in hexadecimal with its binary
   * exponent. O(W)-bit formatting supplies both production identity and parsed
   * canonical-spelling checks; numeric rounding never supplies the key.
   */
  function encode(value: Dyadic): string {
    return `d:${value.n.toString(16)}p${value.e}`;
  }

  /**
   * Validate canonical spelling and exact unit range before numeric inversion.
   * Affine products of normalized binary64 inputs have exponent at least -2148;
   * this gives the 550-character/exponent bounds, without a geometry tolerance
   * or producer-provenance certificate. Bounded parsing, normalization and range
   * comparison visit O(W) key bits. Invalid keys throw, and only the validated
   * pair escapes to serve all following local checks.
   */
  function parse(key: string): Dyadic {
    if (typeof key !== "string" || key.length > 550)
      throw new Error("Invalid canonical dyadic phase key");
    const match: RegExpExecArray | null =
      /^d:([0-9a-f]+)p(-?(?:0|[1-9][0-9]*))$/.exec(key);
    if (!match) throw new Error("Invalid canonical dyadic phase key");
    const exponent: number = Number(match[2]);
    if (!Number.isSafeInteger(exponent) || exponent < -2148 || exponent > 0)
      throw new Error(
        "Canonical dyadic exponent is outside binary64 affine phase bounds",
      );
    const value: Dyadic = normalize(BigInt(`0x${match[1]}`), exponent);
    if (encode(value) !== key || subtract(value, { n: 1n, e: 0 }).n > 0n)
      throw new Error("Noncanonical or out-of-range dyadic phase key");
    return value;
  }

  /**
   * Round a private nonnegative rational times a power of two, exactly in [0,1].
   * Quotient/remainder quantization at the normal 53-bit or subnormal 2^-1074
   * grid implements nearest-even without intermediate Number division or double
   * rounding. Bit lengths, fixed shifts/comparisons and one division operate on
   * O(W)-bit call-local operands; one quotient/remainder resolves both direction
   * and ties. Underflow returns zero for the caller to qualify.
   */
  function rounded(n: bigint, d: bigint, e: number): number {
    if (n === 0n) return 0;
    let power: number = n.toString(2).length - d.toString(2).length;
    if (power >= 0 ? n < d << BigInt(power) : n << BigInt(-power) < d) power--;
    const grid: number = Math.max(-1074, power + e - 52),
      shift: number = e - grid;
    const numerator: bigint = shift >= 0 ? n << BigInt(shift) : n,
      denominator: bigint = shift >= 0 ? d : d << BigInt(-shift);
    let quotient: bigint = numerator / denominator;
    const twiceRemainder: bigint = 2n * (numerator % denominator);
    if (
      twiceRemainder > denominator ||
      (twiceRemainder === denominator && (quotient & 1n) === 1n)
    )
      quotient++;
    return Number(quotient) * 2 ** grid;
  }

  /**
   * Order exact JavaScript strings without locale collation, visiting at most
   * the first unequal position. Authority/use ordering therefore depends on
   * neither input order nor object identity and retains no state.
   */
  function lexical(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
  }
}
