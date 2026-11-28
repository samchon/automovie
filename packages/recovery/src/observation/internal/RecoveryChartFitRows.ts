import type { IAutoMovieRecoveryChartFitRows } from "@automovie/interface";

/*
 * Stream one position row and its optional two physical-gradient rows. Signed
 * derivative Bernstein weights are linear observations of coefficients, not
 * additional point positions. Physical operators already contain the leaf
 * parameter scales and the declared millimetre exchange length. No derivative
 * target is restricted to the position enclosure. Row mass is measured in the
 * same arithmetic so a solver can translate position coordinates without
 * subtracting its origin from an unscaled derivative target.
 * A malformed position or derivative throws when its row is requested.
 * Previously yielded valid rows and their target references stay unchanged.
 */
export function* RecoveryChartFitRows(
  sample: Parameters<IAutoMovieRecoveryChartFitRows.Operation>[0],
): ReturnType<IAutoMovieRecoveryChartFitRows.Operation> {
  if (
    !Number.isFinite(sample.u) ||
    sample.u < 0 ||
    sample.u > 1 ||
    !Number.isFinite(sample.v) ||
    sample.v < 0 ||
    sample.v > 1 ||
    !finiteTuple(sample.pointMm)
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
    if (sample.physicalJet.directions?.length !== 2)
      throw new Error(
        "A physical tangent frame requires exactly two directional observations",
      );
    for (const direction of sample.physicalJet.directions) {
      if (
        !direction ||
        !finiteTuple(direction.targetMm) ||
        !Number.isFinite(direction.du) ||
        !Number.isFinite(direction.dv) ||
        (direction.du === 0 && direction.dv === 0)
      )
        throw new Error(
          "Finite nonzero physical directional operators and finite derivative targets are required",
        );
      const coefficients: number[] = Array.from(
        { length: 16 },
        (_: unknown, id: number): number => {
          const coefficient: number =
            direction.du * du[id % 4]! * v[Math.floor(id / 4)]! +
            direction.dv * u[id % 4]! * dv[Math.floor(id / 4)]!;
          if (!Number.isFinite(coefficient))
            throw new Error("Physical directional row is unrepresentable");
          return coefficient;
        },
      );
      const mass: number = coefficients.reduce(
        (sum: number, value: number): number => sum + value,
        0,
      );
      if (!Number.isFinite(mass))
        throw new Error("Physical directional row mass is unrepresentable");
      yield {
        kind: "physical-gradient",
        coefficients,
        targetMm: direction.targetMm,
        mass,
      };
    }
  }
}

/* Indexed reads detect holes even when the tuple has nominal length three. */
function finiteTuple(point: readonly number[]): boolean {
  return (
    point?.length === 3 &&
    Number.isFinite(point[0]) &&
    Number.isFinite(point[1]) &&
    Number.isFinite(point[2])
  );
}
