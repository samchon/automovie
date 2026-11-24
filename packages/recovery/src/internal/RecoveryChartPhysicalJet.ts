import type { IAutoMovieRecoveryChartPhysicalJet } from "@automovie/interface";

/**
 * Form two physical tangent observations for one affine source triangle. For
 * physical edges K=Q R and UV edges U, T=U R^-1 maps orthonormal physical
 * tangent coordinates to global UV. A leaf basis contributes
 * lengthMm*(phi_s_T[0,a]/hu + phi_t_T[1,a]/hv), with target lengthMm*Q[:,a].
 * Thus the two rows measure the source-metric first derivative residual.
 * Targets are millimetres and receive no position-origin subtraction.
 *
 * The original triangle may cross the leaf bounds. Its frame is reusable by
 * every clipped child and quadrature point. UV orientation must be positive. A
 * second physical edge unresolved at machine-relative angular precision,
 * nonrepresentable positive area or nonfinite arithmetic throws. The diagonal
 * scale ratio and edge reconstruction residual are diagnostics, not condition
 * numbers, rank certificates or continuous source-error bounds. Input arrays
 * are not mutated and no geometry or normal is published.
 */
export function RecoveryChartPhysicalJet(
  input: Parameters<IAutoMovieRecoveryChartPhysicalJet.Operation>[0],
): ReturnType<IAutoMovieRecoveryChartPhysicalJet.Operation> {
  if (
    input.pointsMm.length !== 3 ||
    input.parameters.length !== 3 ||
    input.bounds.length !== 4 ||
    input.pointsMm.some((p: readonly number[]): boolean => p.length !== 3) ||
    input.parameters.some((p: readonly number[]): boolean => p.length !== 2) ||
    !(input.lengthMm > 0)
  )
    throw new Error(
      "Finite source triangle, UV addresses, leaf bounds and positive physical length are required",
    );
  const hu: number = input.bounds[1] - input.bounds[0],
    hv: number = input.bounds[3] - input.bounds[2];
  if (!(hu > 0 && hv > 0))
    throw new Error("A positive representable affine leaf is required");
  const a: number[] = input.pointsMm[1].map(
    (x: number, k: number): number => x - input.pointsMm[0][k]!,
  );
  const b: number[] = input.pointsMm[2].map(
    (x: number, k: number): number => x - input.pointsMm[0][k]!,
  );
  const ua: number = input.parameters[1][0] - input.parameters[0][0],
    va: number = input.parameters[1][1] - input.parameters[0][1];
  const ub: number = input.parameters[2][0] - input.parameters[0][0],
    vb: number = input.parameters[2][1] - input.parameters[0][1];
  const determinantUv: number = ua * vb - va * ub;
  const r11: number = Math.hypot(...a),
    bLength: number = Math.hypot(...b);
  if (!(determinantUv > 0 && r11 > 0 && bLength > 0))
    throw new Error(
      "Positive representable UV orientation and noncollapsed physical edges are required",
    );
  const q1: number[] = a.map((x: number): number => x / r11);
  let r12: number = q1.reduce(
    (sum: number, x: number, k: number): number => sum + x * b[k]!,
    0,
  );
  const remainder: number[] = b.map(
    (x: number, k: number): number => x - r12 * q1[k]!,
  );
  const correction: number = q1.reduce(
    (sum: number, x: number, k: number): number => sum + x * remainder[k]!,
    0,
  );
  r12 += correction;
  for (let k: number = 0; k < 3; k++) remainder[k] -= correction * q1[k]!;
  const r22: number = Math.hypot(...remainder);
  if (!(r22 > Number.EPSILON * bLength))
    throw new Error(
      "The physical tangent frame is unresolved at binary64 angular precision",
    );
  const q2: number[] = remainder.map((x: number): number => x / r22);
  const sourceAreaMm2: number = r11 >= r22 ? (r11 / 2) * r22 : r11 * (r22 / 2);
  const tangentScaleRatio: number = Math.min(r11, r22) / Math.max(r11, r22);
  const reconstructionErrorMm: number = Math.max(
    Math.hypot(...a.map((x: number, k: number): number => x - q1[k]! * r11)),
    Math.hypot(
      ...b.map(
        (x: number, k: number): number => x - q1[k]! * r12 - q2[k]! * r22,
      ),
    ),
  );
  const shear: number = r12 / r11;
  const t00: number = ua / r11,
    t10: number = va / r11;
  const transverseU: number = ub - ua * shear,
    transverseV: number = vb - va * shear;
  const t01: number = transverseU / r22,
    t11: number = transverseV / r22;
  if (
    (ua !== 0 && t00 === 0) ||
    (va !== 0 && t10 === 0) ||
    (transverseU !== 0 && t01 === 0) ||
    (transverseV !== 0 && t11 === 0)
  )
    throw new Error("A nonzero UV-to-physical frame entry underflowed");
  // Equivalent product orders avoid a lost intermediate when the final row is representable.
  const scaled: (value: number, width: number) => number = (
    value: number,
    width: number,
  ): number => {
    if (value === 0) return 0;
    const candidates: number[] = [
      (input.lengthMm * value) / width,
      (input.lengthMm / width) * value,
      (value / width) * input.lengthMm,
    ];
    const found: number | undefined = candidates.find(
      (x: number): boolean => x !== 0,
    );
    if (found === undefined)
      throw new Error(
        "A nonzero physical derivative weight is not representable",
      );
    return found;
  };
  const direction: (
    u: number,
    v: number,
    q: readonly number[],
  ) => { du: number; dv: number; targetMm: [number, number, number] } = (
    u: number,
    v: number,
    q: readonly number[],
  ): { du: number; dv: number; targetMm: [number, number, number] } => ({
    du: scaled(u, hu),
    dv: scaled(v, hv),
    targetMm: [
      input.lengthMm * q[0]!,
      input.lengthMm * q[1]!,
      input.lengthMm * q[2]!,
    ],
  });
  const directions: [
    { du: number; dv: number; targetMm: [number, number, number] },
    { du: number; dv: number; targetMm: [number, number, number] },
  ] = [direction(t00, t10, q1), direction(t01, t11, q2)];
  if (
    !(sourceAreaMm2 > 0 && tangentScaleRatio > 0) ||
    directions.some(
      (d: (typeof directions)[number]): boolean => d.du === 0 && d.dv === 0,
    )
  )
    throw new Error("The physical tangent observation is not representable");
  return {
    directions,
    sourceAreaMm2,
    determinantUv,
    tangentScaleRatio,
    reconstructionErrorMm,
  };
}
