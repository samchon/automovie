import { ISubdivisionLevel } from "./ISubdivisionLevel";

/**
 * Frozen-metric discrete bending residuals M^(-1/2) C on a quad cage.
 * C is cotangent stiffness and M barycentric area mass. The diagonal 0–2
 * matches the emitted render triangles. This discrete norm approximates
 * bending; it is not the analytic plate integral of Halstead et al. (1993).
 * Zero-area triangles or zero vertex mass are refused, with no regularizer.
 *
 * @evidence contracts/common.md#principled-implementation The cotangent finite-element Laplacian with lumped barycentric mass gives the squared mass-weighted discrete Laplacian energy. The metric is frozen at the supplied initial controls, so the optimization is quadratic rather than an undeclared nonlinear surface-energy solve.
 * @evidence contracts/common.md#clear-and-simple-design Returns sparse physical-coordinate residual rows; the fitting coordinator composes them with hierarchical coordinates and performs the quadratic solve separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cotangents retain their signs, degenerate metric triangles are refused and no anatomy coefficient, clamping or solver regularization changes the declared energy.
 * @evidence contracts/common.md#meaningful-documentation States the mass, stiffness, triangulation, frozen metric, distinction from analytic plate energy and degeneracy refusal. A positive scalar mean-diagonal normalization changes units but not the minimizer.
 * @evidence contracts/performance.md#efficient-algorithms Each quad contributes two triangles and six edge updates; sparse row construction and normalization are linear in the stored stiffness terms.
 * @evidence contracts/performance.md#reuse-equivalent-work One frozen stiffness and mass serves all three coordinate solves; no metric is rebuilt per axis.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned row maps own their coefficients; mass and construction arrays are local to the call and no state is retained.
 */
export function subdivisionBendingRows(level: ISubdivisionLevel): Array<Map<number, number>> {
  const count: number = level.topology.vertexCount;
  const mass: number[] = new Array<number>(count).fill(0);
  const rows: Array<Map<number, number>> = Array.from({ length: count }, (): Map<number, number> => new Map());
  const point: (i: number) => [number, number, number] = (i: number): [number, number, number] => level.positions.slice(3 * i, 3 * i + 3) as [number, number, number];
  const subtract: (a: number[], b: number[]) => number[] = (a: number[], b: number[]): number[] => a.map((value: number, axis: number): number => value - b[axis]!);
  const dot: (a: number[], b: number[]) => number = (a: number[], b: number[]): number => a.reduce((sum: number, value: number, axis: number): number => sum + value * b[axis]!, 0);
  const add: (i: number, j: number, weight: number) => void = (i: number, j: number, weight: number): void => {
    rows[i]!.set(i, (rows[i]!.get(i) ?? 0) + weight);
    rows[i]!.set(j, (rows[i]!.get(j) ?? 0) - weight);
  };
  for (let f: number = 0; f < level.topology.faceVertices.length; f += 4) {
    const vertices: number[] = level.topology.faceVertices.slice(f, f + 4);
    for (const triangle of [[vertices[0]!, vertices[1]!, vertices[2]!], [vertices[0]!, vertices[2]!, vertices[3]!]]) {
      const positions: number[][] = triangle.map(point);
      const u: number[] = subtract(positions[1]!, positions[0]!);
      const v: number[] = subtract(positions[2]!, positions[0]!);
      const area2: number = Math.hypot(u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!);
      if (!(area2 > 0) || !Number.isFinite(area2)) throw new Error("fitting metric contains a degenerate triangle");
      for (let k: number = 0; k < 3; k++) {
        mass[triangle[k]!]! += area2 / 6;
        const a: number = triangle[(k + 1) % 3]!;
        const b: number = triangle[(k + 2) % 3]!;
        const cot: number = dot(subtract(positions[(k + 1) % 3]!, positions[k]!), subtract(positions[(k + 2) % 3]!, positions[k]!)) / area2 / 2;
        add(a, b, cot);
        add(b, a, cot);
      }
    }
  }
  let scale: number = 0;
  rows.forEach((row: Map<number, number>, i: number): void => {
    if (!(mass[i]! > 0)) throw new Error(`fitting metric vertex ${i} has no area`);
    for (const weight of row.values()) scale += weight * weight / mass[i]! / count;
  });
  if (!(scale > 0) || !Number.isFinite(scale)) throw new Error("fitting metric has no finite bending energy");
  rows.forEach((row: Map<number, number>, i: number): void => {
    const divisor: number = Math.sqrt(mass[i]! * scale);
    for (const [index, weight] of row) row.set(index, weight / divisor);
  });
  return rows;
}

