/** One coding-agent source module that cannot be recovered from legacy data. */
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
