/** Carry a rest displacement to the posed frame: `R d`. */
export function carryToPosed(rotation: number[][], d: number[]): number[] {
  return [0, 1, 2].map(
    (r) =>
      rotation[r][0] * d[0] + rotation[r][1] * d[1] + rotation[r][2] * d[2],
  );
}
