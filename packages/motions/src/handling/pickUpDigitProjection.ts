const LIMITS: readonly (readonly [number, number])[] = [
  [-33, 42],
  [-26.5, 26.5],
  [-8.5, 8.5],
  [0, 55],
  [-5, 90],
  [-25, 90],
  [-30, 30],
  [0, 115],
  [-20, 90],
];

const clamp = (x: number, a: number, b: number): number =>
  Math.min(b, Math.max(a, x));

const dot = (a: readonly number[], b: readonly number[]): number =>
  a.reduce((sum, value, i) => sum + value * b[i]!, 0);

function solve(input: number[][], values: number[]): number[] {
  const size = values.length;
  const rows = input.map((row, i) => [...row, values[i]!]);
  for (let k = 0; k < size; ++k) {
    let pivot = k;
    for (let i = k + 1; i < size; ++i)
      if (Math.abs(rows[i]![k]!) > Math.abs(rows[pivot]![k]!)) pivot = i;
    [rows[k], rows[pivot]] = [rows[pivot]!, rows[k]!];
    const row = rows[k]!;
    const scale = row[k]!;
    for (let j = k; j <= size; ++j) row[j] = row[j]! / scale;
    for (let i = 0; i < size; ++i) {
      if (i === k) continue;
      const other = rows[i]!;
      const weight = other[k]!;
      for (let j = k; j <= size; ++j)
        other[j] = other[j]! - weight * row[j]!;
    }
  }
  return rows.map((row) => row[size]!);
}

/** Fit the two gripping digits in the clinical joint chart at one prepared instant. */
export function pickUpDigitProjection(
  read: (angles: readonly number[]) => number[],
  aperture: number,
  minimums: readonly number[],
  reference: readonly number[],
): pickUpDigitProjection.IProjection {
  const limit = (values: readonly number[]): number[] =>
    values.map((value, i) => clamp(value, ...LIMITS[i]!));
  const residual = (rows: readonly number[]): number[] => [
    aperture - rows[0]!,
    ...minimums.map((minimum, i) => Math.max(0, minimum - rows[i + 1]!)),
  ];
  const score = (f: readonly number[]): number =>
    f[0]! ** 2 + 3 * dot(f.slice(1), f.slice(1));
  let angles = limit(reference);
  let rows = read(angles);
  let errors = residual(rows);
  for (let iteration = 0; iteration < 36; ++iteration) {
    if (errors.every((e) => Math.abs(e) < 2e-7)) break;
    const active = [
      0,
      ...minimums.flatMap((b, i) => (b + 0.00008 > rows[i + 1]! ? [i + 1] : [])),
    ];
    const columns = LIMITS.map((range, j) => {
      const delta = angles[j]! + 0.14 > range[1] ? -0.14 : 0.14;
      const input = [...angles];
      input[j] = input[j]! + delta;
      const trial = read(input);
      return active.map((r) => ((trial[r]! - rows[r]!) * 1000) / delta);
    });
    const jacobian = active.map((_, i) => columns.map((column) => column[i]!));
    const multipliers = solve(
      jacobian.map((a, i) =>
        jacobian.map((b, j) => dot(a, b) + (i === j ? 0.001 : 0)),
      ),
      active.map((r) => errors[r]! * 1000),
    );
    const update = columns.map((column) => clamp(dot(column, multipliers), -12, 12));
    const before = score(errors);
    let improved = false;
    for (const scale of [1, 0.6, 0.3, 0.15, 0.075, 0.035]) {
      const next = limit(angles.map((value, j) => value + scale * update[j]!));
      const sample = read(next);
      const after = residual(sample);
      if (score(after) < before * (1 - 1e-7)) {
        angles = next;
        rows = sample;
        errors = after;
        improved = true;
        break;
      }
    }
    if (!improved) break;
  }
  return { angles, error: Math.sqrt(score(errors)) };
}

/** Result of projecting the digit angles at one prepared instant. */
export namespace pickUpDigitProjection {
  export interface IProjection {
    /** The feasible point in clinical degrees and its residual in metres. */
    angles: number[];
    error: number;
  }
}
