/**
 * One coding-agent source module that cannot be recovered from legacy data.
 *
 * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `IAutoMovieLegacySourceTodo` as the portable data boundary for the operations resume compatibility classification requirement.
 * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `IAutoMovieLegacySourceTodo` for the execution resume compatibility system contract.
 */
export interface IAutoMovieLegacySourceTodo {
  /**
   * Legacy shot whose performance authoring source was not persisted.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `shot` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `shot` for the execution resume compatibility system contract.
   */
  shot: string;

  /**
   * Proposed production source module path.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `module` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `module` for the execution resume compatibility system contract.
   */
  module: string;

  /**
   * Proposed named source export.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `export` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `export` for the execution resume compatibility system contract.
   */
  export: string;

  /**
   * Exact recovery limitation and required next action.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `reason` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `reason` for the execution resume compatibility system contract.
   */
  reason: string;
}
