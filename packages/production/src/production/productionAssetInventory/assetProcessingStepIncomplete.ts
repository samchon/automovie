import { IAutoMovieAssetProvenance } from "@automovie/interface";

/**
 * Recognize a blank tool or command in an optional processing declaration.
 *
 * @evidence contracts/common.md#principled-implementation Both declared text roles must contain a non-whitespace character and accepted spellings are left unchanged.
 * @evidence contracts/common.md#clear-and-simple-design This ledger text check is separate from generated-origin validation and current digest comparison.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A nonblank command is provenance metadata, not proof the tool ran or transformed bytes correctly.
 * @evidence contracts/common.md#meaningful-documentation States optional-step text obligations without an execution or reproducibility claim.
 * @evidence contracts/performance.md#efficient-algorithms Two trims scale with tool/command text length and read no image/model data.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each supplied processing record is checked anew with no cached execution result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No process, file or retained history is acquired by this predicate.
 *
 * @author Samchon
 */
export function assetProcessingStepIncomplete(
  step: NonNullable<IAutoMovieAssetProvenance["processing"]>[number],
): boolean { return step.tool.trim().length === 0 || step.command.trim().length === 0; }
