/**
 * Stream one position row and its optional two physical-gradient rows.
 * Signed derivative Bernstein weights are linear observations of coefficients,
 * not additional point positions. Physical operators already contain the leaf
 * parameter scales and the declared millimetre exchange length. No derivative
 * target is restricted to the position enclosure. Row mass is measured in the
 * same arithmetic so a solver can translate position coordinates without
 * subtracting its origin from an unscaled derivative target.
 *
 * @evidence contracts/common.md#principled-implementation Tensor cubic Bernstein values and analytic first derivatives define linear position and physical directional-derivative observations of one coefficient field.
 * @evidence contracts/common.md#clear-and-simple-design One lazy row owner serves sparse assembly, independent data rank and final objective evaluation with identical signed weights and targets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Derivative targets remain explicitly distinct from points. No source normal field, clipping, regularizer or candidate-surface sample supplies observations.
 * @evidence contracts/common.md#meaningful-documentation States signed row weights, local parameter scales, millimetre target units, translation mass and private observation lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Each input sample yields at most three fixed sixteen-term rows in O(1) arithmetic; no observation-count-sized derivative array is materialized.
 * @evidence contracts/performance.md#reuse-equivalent-work Both axis basis values and derivatives are computed once and reused by all rows of the sample. Callers reuse their existing immutable quadrature observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The generator retains one sample and one fixed-size row until advancement or closure. Callers consume transient rows without retaining an expanded observation table.
 */
export function* RecoveryChartFitRows(sample: {
  u: number;
  v: number;
  pointMm: readonly [number, number, number];
  physicalJet?: {
    directions: readonly {
      du: number;
      dv: number;
      targetMm: readonly [number, number, number];
    }[];
  };
}): Generator<
  {
    kind: "position" | "physical-gradient";
    coefficients: number[];
    targetMm: readonly [number, number, number];
    mass: number;
  },
  void,
  void
> {
  if (
    ![sample.u, sample.v, ...sample.pointMm].every(Number.isFinite) ||
    sample.u < 0 ||
    sample.u > 1 ||
    sample.v < 0 ||
    sample.v > 1 ||
    sample.pointMm.length !== 3
  )
    throw new Error("Finite unit-chart position observations are required");
  const basis: (t: number) => number[] = (t: number): number[] => [
    (1 - t) ** 3,
    3 * t * (1 - t) ** 2,
    3 * t ** 2 * (1 - t),
    t ** 3,
  ];
  const derivative: (t: number) => number[] = (t: number): number[] => [
    -3 * (1 - t) ** 2,
    3 * (1 - t) * (1 - 3 * t),
    3 * t * (2 - 3 * t),
    3 * t ** 2,
  ];
  const u: number[] = basis(sample.u),
    v: number[] = basis(sample.v),
    du: number[] = derivative(sample.u),
    dv: number[] = derivative(sample.v);
  const position: number[] = Array.from(
    { length: 16 },
    (_: unknown, id: number): number => u[id % 4]! * v[Math.floor(id / 4)]!,
  );
  yield {
    kind: "position",
    coefficients: position,
    targetMm: sample.pointMm,
    mass: position.reduce(
      (sum: number, value: number): number => sum + value,
      0,
    ),
  };
  if (sample.physicalJet) {
    if (sample.physicalJet.directions.length !== 2)
      throw new Error(
        "A physical tangent frame requires exactly two directional observations",
      );
    for (const direction of sample.physicalJet.directions) {
      if (
        ![direction.du, direction.dv, ...direction.targetMm].every(
          Number.isFinite,
        ) ||
        direction.targetMm.length !== 3 ||
        (direction.du === 0 && direction.dv === 0)
      )
        throw new Error(
          "Finite nonzero physical directional operators and finite derivative targets are required",
        );
      const coefficients: number[] = Array.from(
        { length: 16 },
        (_: unknown, id: number): number =>
          direction.du * du[id % 4]! * v[Math.floor(id / 4)]! +
          direction.dv * u[id % 4]! * dv[Math.floor(id / 4)]!,
      );
      if (!coefficients.every(Number.isFinite))
        throw new Error(
          "A physical derivative observation is not representable",
        );
      yield {
        kind: "physical-gradient",
        coefficients,
        targetMm: direction.targetMm,
        mass: coefficients.reduce(
          (sum: number, value: number): number => sum + value,
          0,
        ),
      };
    }
  }
}
