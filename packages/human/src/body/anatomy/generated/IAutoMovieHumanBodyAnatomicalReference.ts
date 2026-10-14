/**
 * The exact neutral reference rig an anatomical inspection evaluated.
 *
 * The basis names the compiled body basis whose neutral reference supplied the rig centres. Its neutral is not the requested person's skin, and the record is reference provenance, never a registered personal centre.
 *
 * @evidence contracts/common.md#principled-implementation Compiled basis identity and neutral-reference discriminator identify the evaluation supplying candidate joint centres.
 * @evidence contracts/common.md#clear-and-simple-design Two provenance fields identify source evaluation without mixing requested shape/skin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A neutral reference supplies neither registered personal centres nor individual measurements.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish compiled basis, neutral evaluation and unevaluated person skin.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The reference record compiles no rig and locates no joint centres.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Basis provenance declares a dependency without sharing completed evaluations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This pair owns no neutral mesh, retained builder or loading task.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAnatomicalReference {
  /** Exact compiled body basis identity of the neutral reference rig. */
  basis: string;

  /** The neutral reference evaluation, not the requested person's skin. */
  evaluation: "neutral-reference";
}
