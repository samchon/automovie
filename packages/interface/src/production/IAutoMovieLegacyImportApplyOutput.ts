import { IAutoMovieLegacyImportPlan } from "./IAutoMovieLegacyImportPlan";

/**
 * Result of applying or re-applying one legacy import plan.
 *
 * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-canonical-result Exposes `IAutoMovieLegacyImportApplyOutput` as the portable data boundary for the external conversion receipt canonical result requirement.
 * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-canonical-receipt-result Types `IAutoMovieLegacyImportApplyOutput` for the interchange canonical receipt result system contract.
 */
export interface IAutoMovieLegacyImportApplyOutput {
  /**
   * Whether state was created or the identical plan was already applied.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-canonical-result Exposes `status` as the portable data boundary for the external conversion receipt canonical result requirement.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-canonical-receipt-result Types `status` for the interchange canonical receipt result system contract.
   */
  status: "applied" | "unchanged";

  /**
   * Exact plan persisted by the import.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-canonical-result Exposes `plan` as the portable data boundary for the external conversion receipt canonical result requirement.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-canonical-receipt-result Types `plan` for the interchange canonical receipt result system contract.
   */
  plan: IAutoMovieLegacyImportPlan;
}
