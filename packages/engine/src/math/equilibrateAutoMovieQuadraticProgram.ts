import type { IAutoMovieQuadraticConicProgram } from "@automovie/interface";

/**
 * Apply ten bounded Ruiz diagonal equilibration passes to owned conic arrays.
 * The change x=D_xhat, z=E_zhat/c is invertible; it alters neither the authored
 * objective nor constraints. Original-coordinate residuals undo every scale.
 * Bounds and pass count retain the preceding Clarabel configuration.
 */
export function equilibrateAutoMovieQuadraticProgram(
  data: IAutoMovieQuadraticConicProgram,
): void {
  const dn: Float64Array = new Float64Array(data.n);
  const en: Float64Array = new Float64Array(data.m);
  for (let pass: number = 0; pass < 10; pass++) {
    dn.set(data.p);
    en.fill(0);
    for (let column: number = 0; column < data.n; column++)
      for (
        let at: number = data.columns[column]!;
        at < data.columns[column + 1]!;
        at++
      ) {
        const value: number = Math.abs(data.values[at]!);
        dn[column] = Math.max(dn[column]!, value);
        en[data.rows[at]!] = Math.max(en[data.rows[at]!]!, value);
      }
    for (let column: number = 0; column < data.n; column++)
      dn[column] = Math.max(
        1e-4 / data.d[column]!,
        Math.min(1e4 / data.d[column]!, 1 / Math.sqrt(dn[column] || 1)),
      );
    for (let row: number = 0; row < data.m; row++)
      en[row] = Math.max(
        1e-4 / data.e[row]!,
        Math.min(1e4 / data.e[row]!, 1 / Math.sqrt(en[row] || 1)),
      );
    let mean: number = 0;
    let normq: number = 0;
    for (let column: number = 0; column < data.n; column++) {
      data.d[column] *= dn[column]!;
      data.p[column] *= dn[column]! * dn[column]!;
      data.q[column] *= dn[column]!;
      mean += data.p[column]! / data.n;
      normq = Math.max(normq, Math.abs(data.q[column]!));
      for (
        let at: number = data.columns[column]!;
        at < data.columns[column + 1]!;
        at++
      )
        data.values[at] *= dn[column]! * en[data.rows[at]!]!;
    }
    for (let row: number = 0; row < data.m; row++) {
      data.e[row] *= en[row]!;
      data.b[row] *= en[row]!;
    }
    if (mean !== 0 && normq !== 0) {
      const scale: number = Math.max(
        1e-4 / data.c,
        Math.min(1e4 / data.c, 1 / Math.max(mean, normq)),
      );
      data.c *= scale;
      for (let column: number = 0; column < data.n; column++) {
        data.p[column] *= scale;
        data.q[column] *= scale;
      }
    }
  }
}
