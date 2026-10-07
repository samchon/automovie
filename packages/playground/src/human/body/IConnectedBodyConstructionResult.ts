import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";

import type { IConnectedBodyPreviewResult } from "./IConnectedBodyPreviewResult";

/**
 * Full source construction buffers and the same owner's admission outcome.
 * A refused construction may be inspected but never becomes accepted history.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Carries every generated part into the existing viewport with its explicit acceptance state.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Keeps geometry availability separate from admission and committed edit state.
 * @author Samchon
 */
export interface IConnectedBodyConstructionResult extends Omit<
  IConnectedBodyPreviewResult,
  "operation"
> {
  /** Distinguishes a draft construction reply from a committed preview. */
  operation: "construct";

  /** Actual existing checks, including each owner's concrete refusal. */
  admission: IAutoMovieHumanConstructionAdmission;
}
