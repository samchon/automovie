import type { ConnectedBodyModel } from "@automovie/human/body/runtime/ConnectedBodyModel";
import type { ConnectedBodyPart } from "@automovie/human/body/runtime/ConnectedBodyPart";

import type { IConnectedBodyResident } from "./IConnectedBodyResident.js";

/**
 * A prepared body frame: the resident group it will be drawn by, the model it
 * shows and each part's declared physical vertex incidence.
 *
 * The frame stays off screen until the editor publishes it.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Keeps one prepared native resident with its numerical body model and copied physical-vertex incidence in part order; publication rechecks correspondence before buffer writes, and callers must keep model topology/values consistent with the prepared resident until commit.
 * @evidence contracts/common.md#clear-and-simple-design A frame couples numerical result and actual GPU candidate without publishing it or transporting render objects through the numerical worker; resident ownership and document commitment have separate existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Physical incidence comes from the transferred part metadata, not coordinate deduplication or a fabricated one-vertex identity; the frame is preparation rather than evidence of a completed displayed image.
 * @evidence contracts/common.md#meaningful-documentation Identifies resident, numerical model, ordered declared physical mapping and off-screen preparation; mutable prepared-model consistency is explicit rather than inferred from the frame type.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result shape runs no mesh allocation, topology comparison or buffer update.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The numerical renderer owns candidate/resident sharing decisions; this record coordinates no repeated prepare itself.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Actual resident buffers/cache are acquired and retired by createConnectedBodyRenderer; this frame type declares references without an independent native release.
 */
export interface IConnectedBodyFrame {
  /** Resident group the frame publishes into. */
  resident: IConnectedBodyResident;

  /** Model the frame shows. */
  model: ConnectedBodyModel;

  /** Declared physical vertex incidence of each part, in part order. */
  physical: ConnectedBodyPart["geometry"]["mesh"]["physicalVertices"][];
}
