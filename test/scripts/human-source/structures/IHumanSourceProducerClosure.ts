import type { IHumanSourceGenerationInput } from "./IHumanSourceGenerationInput.ts";

/**
 * Portable producer inputs and the run-local check that their bytes stayed
 * fixed while the candidate was built. The compiler reference graph owns the
 * dependency population; this result does not contain a hand-maintained list
 * of numerical helper implementations.
 *
 * @author Samchon
 */
export interface IHumanSourceProducerClosure {
  /** Exact-byte records added to the generation's content identity. */
  inputs: readonly IHumanSourceGenerationInput[];

  /** Refuse every changed producer or resolution fact before writing. */
  verifyUnchanged: () => void;
}
