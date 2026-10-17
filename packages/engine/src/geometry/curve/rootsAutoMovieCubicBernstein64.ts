/**
 * Approximate the isolated roots of four finite scalar cubic Bernstein coefficients on [0,1]. Critical points partition sign-monotone intervals; near-zero values use 64 epsilon times max(1, coefficient magnitude), sign changes receive 58 bisections, and roots within 1e-10 merge. The identically zero polynomial returns no discrete roots. These are binary64 construction rules, not interval certificates.
 *
 * @evidence contracts/common.md#principled-implementation Converts the cubic to power coefficients, partitions at the derivative's real roots and bisects every remaining sign-changing interval.
 * @evidence contracts/common.md#clear-and-simple-design One scalar root operation owns the critical-point, tolerance, bisection and duplicate-root policies used by geometric intersections.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Caller-admitted four finite coefficients are required; no sampled fitting, anatomical offset or zero-polynomial continuum is reported as an isolated root.
 * @evidence contracts/common.md#meaningful-documentation States the closed domain, exact numerical tolerances, iteration count, degeneracy and lack of an interval-proof claim.
 * @evidence contracts/performance.md#efficient-algorithms A cubic has at most two critical points and three sign-monotone intervals; at most 58 fixed bisections are performed per eligible interval.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure scalar operation schedules no cross-request work; callers own repeated-query reuse under their coefficient identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Critical points and isolated scalar roots remain invocation-local; the returned root array retains no curve or coefficient owner.
 */
export function rootsAutoMovieCubicBernstein64(q: readonly number[]): number[] {
  const a: number = -q[0]! + 3 * q[1]! - 3 * q[2]! + q[3]!;
  const b: number = 3 * q[0]! - 6 * q[1]! + 3 * q[2]!;
  const c: number = -3 * q[0]! + 3 * q[1]!;
  const d: number = q[0]!;
  if (a === 0 && b === 0 && c === 0 && d === 0) return [];
  const f: (t: number) => number = (t: number): number =>
    ((a * t + b) * t + c) * t + d;
  const scale: number = Math.max(
    ...q.map((v: number): number => Math.abs(v)),
    1,
  );
  const tolerance: number = 64 * Number.EPSILON * scale;
  const critical: number[] = [0, 1];
  const aa: number = 3 * a;
  const bb: number = 2 * b;
  if (Math.abs(aa) < Number.EPSILON * scale) {
    if (Math.abs(bb) > Number.EPSILON * scale) critical.push(-c / bb);
  } else {
    const disc: number = bb * bb - 4 * aa * c;
    if (disc >= 0) {
      critical.push(
        (-bb - Math.sqrt(disc)) / (2 * aa),
        (-bb + Math.sqrt(disc)) / (2 * aa),
      );
    }
  }
  const cuts: number[] = critical
    .filter((v: number): boolean => v >= 0 && v <= 1)
    .sort((u: number, v: number): number => u - v);
  const result: number[] = [];
  const put: (t: number) => void = (t: number): void => {
    if (!result.some((v: number): boolean => Math.abs(t - v) < 1e-10))
      result.push(t);
  };
  for (const t of cuts) if (Math.abs(f(t)) <= tolerance) put(t);
  for (let i: number = 1; i < cuts.length; i++) {
    let lo: number = cuts[i - 1]!;
    let hi: number = cuts[i]!;
    if (
      f(lo) * f(hi) >= 0 ||
      Math.abs(f(lo)) <= tolerance ||
      Math.abs(f(hi)) <= tolerance
    )
      continue;
    const sign: number = Math.sign(f(lo));
    for (let k: number = 0; k < 58; k++) {
      const t: number = (lo + hi) / 2;
      if (Math.sign(f(t)) === sign) lo = t;
      else hi = t;
    }
    put((lo + hi) / 2);
  }
  return result.sort((u: number, v: number): number => u - v);
}
