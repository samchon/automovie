import { bracketedRoot } from "@automovie/engine";

/**
 * Resolve one locked-field projection request on a declared finite candidate
 * domain.
 *
 * The projection is the breast cap's rail-to-pole chord, in millimetres. The
 * caller supplies the finite geometric bounds of its candidate source.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Nine actual candidate tapes bracket the requested bust before the existing scalar root solve. A candidate-local bare tape is checked only against that candidate, never used as a global moving-plane lower bound; multiple target probes leave projection unidentified.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One evaluator supplies bust and its candidate-local bare tape; one finite bracket policy owns inversion.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unavailable or nonmonotone reading throws; no evaluator value is fabricated and no tissue field is relaxed.
 * @evidence contracts/development/common.md#meaningful-documentation Projection and tapes use physical mm; returned resolution is an input constraint result rather than shape acceptance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Nine probes and at most64 existing bracketed-root iterations, followed by an actual residual reading.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure bounded scalar solve has no work across calls to coordinate.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only bounded probes and a scalar result survive the synchronous evaluator calls.
 */
export function AutoMovieHumanProjectionConstraint(
  domain: readonly [number, number],
  target: number,
  tolerance: number,
  read: (projection: number) => { bust: number; bareBust: number },
): {
  status: "resolved" | "unavailable";
  projection: number | null;
  actual: number | null;
  reason: string | null;
} {
  const [lo, hi] = domain;
  if (
    !(lo < hi) ||
    ![lo, hi, target, tolerance].every(
      (x: number): boolean => Number.isFinite(x) && x > 0,
    )
  )
    throw new Error(
      "projection constraint needs finite positive inputs and an ordered domain",
    );
  const evaluate = (
    p: number,
  ): { p: number; value: number; bareBust: number } => {
    const { bust, bareBust } = read(p);
    if (
      !Number.isFinite(bust) ||
      !Number.isFinite(bareBust) ||
      bust < bareBust - tolerance
    )
      throw new Error(
        "native candidate bust/bare tape is unavailable or inconsistent",
      );
    return { p, value: bust, bareBust };
  };
  const probes: { p: number; value: number; bareBust: number }[] = Array.from(
    { length: 9 },
    (_, k: number) => evaluate(lo + ((hi - lo) * k) / 8),
  );
  const observedReason: (detail: string) => string = (detail: string): string =>
    detail +
    "; actual finite probes=" +
    JSON.stringify({ domain, target, tolerance, probes });
  if (
    probes.some(
      (p, k): boolean => k > 0 && p.value < probes[k - 1]!.value - tolerance,
    )
  )
    throw new Error(
      observedReason(
        "projection response is not monotone on the declared finite bracket probes",
      ),
    );
  const brackets = probes
    .slice(0, -1)
    .map((p, k) => [p, probes[k + 1]!])
    .filter(
      ([a, b]): boolean => (a!.value - target) * (b!.value - target) <= 0,
    );
  const hits = probes.filter(
    (p): boolean => Math.abs(p.value - target) <= tolerance,
  );
  if (hits.length > 1)
    return {
      status: "unavailable",
      projection: null,
      actual: null,
      reason: observedReason(
        "multiple candidate projections meet the tape tolerance; projection is not identified",
      ),
    };
  if (hits.length === 1)
    return {
      status: "resolved",
      projection: hits[0]!.p,
      actual: hits[0]!.value,
      reason: null,
    };
  if (brackets.length !== 1)
    return {
      status: "unavailable",
      projection: null,
      actual: null,
      reason: observedReason(
        brackets.length === 0
          ? "no bracket on the declared nine finite probes; this does not prove continuous infeasibility"
          : "multiple projection brackets remain unresolved",
      ),
    };
  const bracket = brackets[0]!;
  const projection: number = bracketedRoot(
    (p: number): number => evaluate(p).value - target,
    bracket[0]!.p,
    bracket[1]!.p,
    1e-6,
    64,
  );
  const actual: number = evaluate(projection).value;
  return {
    status: Math.abs(actual - target) <= tolerance ? "resolved" : "unavailable",
    projection,
    actual,
    reason:
      Math.abs(actual - target) <= tolerance
        ? null
        : observedReason(
            "projection root residual exceeds the declared tape tolerance",
          ),
  };
}
