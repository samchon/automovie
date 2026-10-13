/**
 * One coding-agent source module that cannot be recovered from legacy data.
 *
 * @evidence contracts/common.md#principled-implementation Legacy planning records the shot and proposed module/export together with the exact missing authoring fact; persisted runtime data cannot reconstruct the original coding-agent source.
 * @evidence contracts/common.md#clear-and-simple-design A compact unresolved binding stays in the immutable import plan while later source authoring owns its implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Proposed addresses are explicit TODOs, not generated executable source or evidence that the recovered draft already compiles.
 * @evidence contracts/common.md#meaningful-documentation Defines the lost legacy shot source, proposed path and export, and actionable recovery limitation.
 * @author Samchon
 */
export interface IAutoMovieLegacySourceTodo {
  /** Legacy shot whose performance authoring source was not persisted. */
  shot: string;

  /** Proposed production source module path. */
  module: string;

  /** Proposed named source export. */
  export: string;

  /** Exact recovery limitation and required next action. */
  reason: string;
}
