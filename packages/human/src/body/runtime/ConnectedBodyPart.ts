import type { IAutoMovieModelPart } from "@automovie/interface";

import type { IConnectedBodyMeshGeometry } from "./IConnectedBodyMeshGeometry";

/**
 * Static model part whose geometry travels in transferable buffers.
 *
 * @evidence contracts/common.md#principled-implementation Existing part identity/material/TRS metadata is preserved while geometry uses the connected worker's prepared static mesh wrapper.
 * @evidence contracts/common.md#clear-and-simple-design Replacing only geometry retains one interface owner for all other model-part metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The carrier cannot imply valid attached-bone animation, transfer completion or topology acceptance; source packing owns actual static admission.
 * @evidence contracts/common.md#meaningful-documentation The geometry member names prepared static mesh data while inherited placement/material meanings stay with the model-part contract.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Part transport typing performs no tessellation, quantization or buffer packing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The wrapper type chooses no sharing of geometry across worker previews.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration itself allocates/transfers no geometry and acquires no render resource.
 * @author Samchon
 */
export interface ConnectedBodyPart extends Omit<
  IAutoMovieModelPart,
  "geometry"
> {
  /** Prepared static mesh. */
  geometry: IConnectedBodyMeshGeometry;
}
