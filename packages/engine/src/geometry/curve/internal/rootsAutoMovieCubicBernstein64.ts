/*
 * Approximate the isolated roots of four finite scalar cubic Bernstein
 * coefficients on [0,1]. Critical points partition sign-monotone intervals;
 * near-zero values use 64 epsilon times max(1, coefficient magnitude), sign
 * changes receive 58 bisections, and roots within 1e-10 merge. The identically
 * zero polynomial returns no discrete roots. These are binary64 construction
 * rules, not interval certificates.
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
      const radical: number = Math.sqrt(disc);
      const numerator: number = -0.5 * (bb + (bb >= 0 ? radical : -radical));
      if (numerator === 0) critical.push(-bb / (2 * aa));
      else critical.push(numerator / aa, c / numerator);
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
