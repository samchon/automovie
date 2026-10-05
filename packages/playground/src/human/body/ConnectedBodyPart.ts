import type { IAutoMovieModelPart } from "@automovie/interface";

import type { IConnectedBodyMeshGeometry } from "./IConnectedBodyMeshGeometry";

/** Static model part whose geometry travels in transferable buffers.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Shows the committed body regions together.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Keeps each resident region's geometry paired with its material binding.
 * @author Samchon
 */
export interface ConnectedBodyPart
  extends Omit<IAutoMovieModelPart, "geometry"> {
  /** Prepared static mesh. */
  geometry: IConnectedBodyMeshGeometry;
}
