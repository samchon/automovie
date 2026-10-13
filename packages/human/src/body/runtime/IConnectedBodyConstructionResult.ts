import type { IAutoMovieHumanConstructionAdmission } from "../../common/structures/IAutoMovieHumanConstructionAdmission";

import type { IConnectedBodyPreviewResult } from "./IConnectedBodyPreviewResult";

/**
 * Full source construction buffers and the same owner's admission outcome.
 * A refused construction may be inspected but never becomes accepted history.
 *
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
