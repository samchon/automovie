/** Shared four-feature vector basis for identified regional hand laws.
 * The caller supplies 28 physical channels: four two-coordinate positions,
 * four tangent magnitudes, then two residual vectors for each feature arc.
 * This evaluator owns no anatomical frame, dimensions, fitted coefficients or
 * boundary selection; each regional law retains those responsibilities.
 */
export namespace HumanHandFeatureKernel {
  /** Two physical coordinates in the caller's transverse frame. */
  export type Pair = [number, number];

  /** Quintic basis powers retain the two endpoint zero-jet residual vectors. */
  const weights: readonly (readonly number[])[] = [
    [1, 0, -3, 2, 0, 0], [0, 0, 3, -2, 0, 0],
    [0, 1, -2, 1, 0, 0], [0, 0, -1, 1, 0, 0],
    [0, 0, 1, -2, 1, 0], [0, 0, -1, 4, -5, 2],
  ];

  /** Exact coefficient evaluation or first/second differentiation in arc phase. */
  export function polynomial(coefficients: readonly number[], parameter: number, order: number): number {
    let value: number = 0;
    for (let i: number = coefficients.length - 1; i >= order; i--) {
      let factor: number = 1;
      for (let j: number = 0; j < order; j++) factor *= i - j;
      value = value * parameter + coefficients[i]! * factor;
    }
    return value;
  }

  /** All arcs share actual feature positions and their one tangent magnitude. */
  export function planar(section: readonly number[], arc: number, phase: number, order: number): Pair {
    const next: number = (arc + 1) % 4;
    const tangent: readonly Pair[] = [[0, 1], [-1, 0], [0, -1], [1, 0]];
    const h: number[] = weights.map((value: readonly number[]): number => polynomial(value, phase, order));
    return [0, 1].map((j: number): number =>
      h[0]! * section[2 * arc + j]! + h[1]! * section[2 * next + j]! +
      h[2]! * section[8 + arc]! * tangent[arc]![j]! +
      h[3]! * section[8 + next]! * tangent[next]![j]! +
      h[4]! * section[12 + 4 * arc + j]! + h[5]! * section[14 + 4 * arc + j]!,
    ) as Pair;
  }

}
