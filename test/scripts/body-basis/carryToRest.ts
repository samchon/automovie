

/** Carry a posed displacement to the rest frame: `Rᵀ d`. */
export function carryToRest(rotation: number[][], d: number[]): number[] {
  return [0, 1, 2].map(
    (r) =>
      rotation[0][r] * d[0] + rotation[1][r] * d[1] + rotation[2][r] * d[2],
  );
}
