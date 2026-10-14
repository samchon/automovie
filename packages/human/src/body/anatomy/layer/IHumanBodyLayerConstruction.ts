import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanConstructionAdmission } from "../../../common/structures/IAutoMovieHumanConstructionAdmission";
import type { IHumanBodyLayerObservation } from "./IHumanBodyLayerObservation";

/**
 * Constructed native layer parts and their separate limited admission. Rejected geometry remains available to explicit construction inspection.
 *
 * @evidence contracts/common.md#principled-implementation Disjoint shell parts, scalar inspection material, native observations and limited admission describe one actual layer construction, including rejected geometry.
 * @evidence contracts/common.md#clear-and-simple-design Geometry/appearance/observations/admission remain separate outputs so explicit inspection can retain failure evidence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejected offsets are not hidden and untextured source finish confers no measured inner-tissue appearance.
 * @evidence contracts/common.md#meaningful-documentation Members state shell partition, source finish, original qualification and unknown-reach refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Construction results declare completed output without running offsets or shell partitioning.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The output bundle coordinates no shared layer construction across requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Result parts/materials belong to their producer without a GPU-resource lifetime.
 * @author Samchon
 */
export interface IHumanBodyLayerConstruction {
  /** Disjoint dermal outer, fascial inner and nonempty rim members of one subcutaneous shell. */
  parts: IAutoMovieModel["parts"];

  /** Source skin scalar appearance, copied as an untextured inspection finish. */
  material: IAutoMovieModel["materials"][number];

  /** Original native observation population and qualification. */
  observation: IHumanBodyLayerObservation;

  /** Limited offset admission, with unknown reach retained as a failure. */
  admission: IAutoMovieHumanConstructionAdmission;
}
