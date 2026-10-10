/**
 * The finite accumulated-area domain refusal of areaWeightedNormals.
 *
 * The existing guard and Error message remain unchanged. A local nonlinear
 * caller can distinguish an undefined candidate normal field from programmer,
 * Source and solver exceptions without matching text or supplying a substitute.
 * Other callers retain ordinary Error compatibility and the inherited name.
 */
export class HumanMeshNormalDomainError extends Error {
  /** Retain the original finite accumulated-area refusal message and inherited Error name. */
  constructor() {
    super("Model normals require finite accumulated areas.");
  }
}
