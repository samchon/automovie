import type { IAutoMovieModel } from "@automovie/interface";

import type { ConnectedBodyPart } from "./ConnectedBodyPart";

/**
 * Model metadata paired with transferable worker part geometry.
 *
 * @evidence contracts/common.md#principled-implementation Existing model identity/material/asset metadata retain their schema while draw-order parts use the connected worker's prepared mesh transport type.
 * @evidence contracts/common.md#clear-and-simple-design Only the parts field changes representation, avoiding a second independently maintained model metadata contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The inherited model schema alone does not establish static admission or transfer success; the packing/export owners validate the actual model.
 * @evidence contracts/common.md#meaningful-documentation The parts member states draw order and transferable geometry ownership while other fields retain their interface documentation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Model transport typing performs no packing, buffer traversal or worker dispatch.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The schema implements no reuse of prior preview models or material caches.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no GPU model, buffer transfer or worker lifetime.
 * @author Samchon
 */
export interface ConnectedBodyModel extends Omit<IAutoMovieModel, "parts"> {
  /** Draw-order parts, each with its own transfer ownership. */
  parts: ConnectedBodyPart[];
}
