/** Posed contact displacements and their transported rest-space rows, metres. */
export interface IBodyContactPush {
  rest: Map<number, number[]>;
  posed: Map<number, number[]>;
  /** Actual per-pair solver records. */
  log: string[];
}
