
/** Twelve ordered structural, shear and bending offsets. Both solvers and the correction gather share this internal table without mutating it; mirror-pair folding depends on this exact ordering. */
export const SOFT_BODY_NEIGHBOURS: ReadonlyArray<
  readonly [column: number, row: number, family: 0 | 1 | 2]
> = [
  [-1, 0, 0],
  [1, 0, 0],
  [0, -1, 0],
  [0, 1, 0],
  [-1, -1, 1],
  [1, -1, 1],
  [-1, 1, 1],
  [1, 1, 1],
  [-2, 0, 2],
  [2, 0, 2],
  [0, -2, 2],
  [0, 2, 2],
];
