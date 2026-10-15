/**
 * A smooth profile through keyframes: the monotone piecewise cubic Hermite interpolant of Fritsch and Carlson (1980, SIAM J Numer Anal 17(2):238-246), constant beyond the first and last key.
 *
 * Monotone between keys, so a profile never overshoots the measured values it passes through: a waist set between a chest and a hip key never bulges past either. Keys are sorted by position; two keys at one position keep the later value.
 *
 * @param keys Pairs of position and value
 * @returns The profile
 */
export function curveAutoMovieHumanTrunk(
  keys: Array<[number, number]>,
): (x: number) => number {
  const k: Array<[number, number]> = [...keys].sort(
    (a: [number, number], b: [number, number]): number => a[0] - b[0],
  );
  const n: number = k.length;
  const slope: number[] = [];
  for (let i: number = 0; i < n - 1; ++i)
    slope.push(
      (k[i + 1]![1] - k[i]![1]) / Math.max(1e-9, k[i + 1]![0] - k[i]![0]),
    );
  const tangent: number[] = k.map((_: [number, number], i: number): number => {
    if (n === 1) return 0;
    if (i === 0) return slope[0]!;
    if (i === n - 1) return slope[n - 2]!;
    const a: number = slope[i - 1]!;
    const b: number = slope[i]!;
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  });
  return (x: number): number => {
    if (x <= k[0]![0]) return k[0]![1];
    if (x >= k[n - 1]![0]) return k[n - 1]![1];
    let i: number = 0;
    while (x > k[i + 1]![0]) ++i;
    const h: number = k[i + 1]![0] - k[i]![0];
    const t: number = (x - k[i]![0]) / h;
    const t2: number = t * t;
    const t3: number = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * k[i]![1] +
      (t3 - 2 * t2 + t) * h * tangent[i]! +
      (-2 * t3 + 3 * t2) * k[i + 1]![1] +
      (t3 - t2) * h * tangent[i + 1]!
    );
  };
}
