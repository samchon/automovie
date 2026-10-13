import type { IAutoMovieModelPart } from "@automovie/interface";

import type { IConnectedBodyMeshGeometry } from "./IConnectedBodyMeshGeometry";

/** Static model part whose geometry travels in transferable buffers.
 * @author Samchon
 */
export interface ConnectedBodyPart extends Omit<
  IAutoMovieModelPart,
  "geometry"
> {
  /** Prepared static mesh. */
  geometry: IConnectedBodyMeshGeometry;
}
