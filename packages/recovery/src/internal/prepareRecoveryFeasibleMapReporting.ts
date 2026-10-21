import type { IAutoMovieRecoveryCameraMapBudget } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapLandmark } from "../structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoveryFeasibleJointOptions } from "../structures/internal/IAutoMovieRecoveryFeasibleJointOptions";
import type { IAutoMovieRecoveryFeasibleMapReporting } from "../structures/internal/IAutoMovieRecoveryFeasibleMapReporting";
import type { IAutoMovieRecoveryFeasibleMapWork } from "../structures/internal/IAutoMovieRecoveryFeasibleMapWork";
import type { IAutoMovieRecoveryFeasibleReportCapacity } from "../structures/internal/IAutoMovieRecoveryFeasibleReportCapacity";
import { RecoveryFeasibleCapacityError } from "./RecoveryFeasibleCapacityError";
import { prepareRecoveryFeasibleMapWork } from "./prepareRecoveryFeasibleMapWork";
import { prepareRecoveryFeasibleReportCapacity } from "./prepareRecoveryFeasibleReportCapacity";

/**
 * Admit original map work, then prepay its complete fixed diagnostic transfer.
 *
 * @evidence contracts/common.md#principled-implementation Original shape/configuration/gauge admission precedes valid report-capacity refusal, and the unchanged numerical retained bound must fit the shared remaining capacity.
 * @evidence contracts/common.md#clear-and-simple-design Direct maps acquire their own scope; checkpoint/scene calls borrow one existing scope. The camera receives numerical work and capacity together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No negative derived cap is fed into original positive-option validation, raw QP budget is raised, or completed report is lost to a new post-fit charge.
 * @evidence contracts/common.md#meaningful-documentation Setup256 applies only to a direct owner; each original-admitted fit prepays64 context-validation visits, then1984 projection/possible trace visits after report capacity qualifies. Their2048 total precedes fitting; rejected prefixes are not refunded. Existing original admission charges and exceptions remain intact.
 * @evidence contracts/performance.md#efficient-algorithms Original O(L) metadata is reused. Fixed context checks and a nine-field transfer add constant work within setup/projection envelopes; no geometric model or actual trial runs here.
 * @evidence contracts/performance.md#reuse-equivalent-work One admitted context serves all nested fits, and one original work record supplies all model/evaluation bounds.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows numerical inputs and context synchronously; the fixed transfer stays in the512 current envelope and no report/history or handle is acquired here.
 */
export function prepareRecoveryFeasibleMapReporting(
  poses: readonly IAutoMovieRecoveryMapPose[],
  landmarks: readonly IAutoMovieRecoveryMapLandmark[],
  intrinsics: readonly (readonly number[])[],
  budget: IAutoMovieRecoveryCameraMapBudget,
  options: IAutoMovieRecoveryFeasibleJointOptions,
  charge: (work: number) => void,
  capacity?: IAutoMovieRecoveryFeasibleReportCapacity,
): IAutoMovieRecoveryFeasibleMapReporting {
  const work: IAutoMovieRecoveryFeasibleMapWork =
    prepareRecoveryFeasibleMapWork(
      poses,
      landmarks,
      intrinsics,
      budget,
      options,
      charge,
    );
  let reporting: IAutoMovieRecoveryFeasibleReportCapacity | undefined =
    capacity;
  if (reporting === undefined) {
    charge(256);
    reporting = prepareRecoveryFeasibleReportCapacity(
      options.maxResidentLinearEntries,
      options.maxResidentLinearEntries,
      0,
    );
  }
  charge(64);
  if (
    !Number.isSafeInteger(reporting.sceneEntries) ||
    reporting.sceneEntries <= 0 ||
    !Number.isSafeInteger(reporting.fitEntries) ||
    reporting.fitEntries > reporting.sceneEntries ||
    reporting.fitEntries > options.maxResidentLinearEntries - 512 ||
    !Number.isSafeInteger(reporting.reservedEntries) ||
    reporting.reservedEntries <= 0
  )
    throw new Error("camera-feasible: owned reporting capacity required");
  if (work.retained > reporting.fitEntries)
    throw new RecoveryFeasibleCapacityError("resident");
  charge(1984);
  return { ...work, reporting };
}
