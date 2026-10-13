import { IAutoMovieLegacyImportPlan } from "./IAutoMovieLegacyImportPlan";

/** Result of applying or re-applying one legacy import plan. */
export interface IAutoMovieLegacyImportApplyOutput {
  /** Whether state was created or the identical plan was already applied. */
  status: "applied" | "unchanged";

  /** Exact plan persisted by the import. */
  plan: IAutoMovieLegacyImportPlan;
}
