/**
 * Solve a person's head channels for head measurement targets. Required and secondary measurement names come from HUMAN_PERSON_HEAD_SOLVE, and values are metres. The numerical owner rejects missing/extra names or unmet required targets and returns a candidate; the panel separately admits it under current intent.
 *
 * @evidence contracts/common.md#principled-implementation Complete-person input, named metre targets and the solvePersonHead discriminant route the registered bounded head-channel inverse.
 * @evidence contracts/common.md#clear-and-simple-design Target transport remains separate from worker numerical optimization and panel display/history admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional secondary pursuit is not represented as a required met target, and numerical completion cannot declare clinical acquisition validity or accepted history.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies target units, required/secondary authority, named refusal and separate current-intent candidate admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This message interface implements no bounded solve, rest-skin evaluation or target validation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The request carries no cache equivalence across documents or target sets.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Correlation and serialized targets allocate no resident evaluator or retained frame in this type.
 *
 * @author Samchon
 */
export interface IConnectedPersonHeadSolveMessage {
  /** Correlates the reply. */
  id: number;

  /** The request kind. */
  kind: "solvePersonHead";

  /** Serialized person document. */
  document: string;

  /** Target in metres per head measurement name (`HUMAN_PERSON_HEAD_SOLVE`). */
  targets: Record<string, number>;
}
