import type { ConnectedBodyModel } from "./ConnectedBodyModel";
import type { ConnectedBodyPart } from "./ConnectedBodyPart";
import type { IConnectedBodyResident } from "./IConnectedBodyResident";

/**
 * A prepared body frame: the resident group it will be drawn by, the model it
 * shows and each part's declared physical vertex incidence.
 *
 * The frame stays off screen until the editor publishes it.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Holds an edit's prepared preview until the editor commits it.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Pairs a prepared model with the resident buffers and source incidence it will publish.
 * @author Samchon
 */
export interface IConnectedBodyFrame {
  /** Resident group the frame publishes into. */
  resident: IConnectedBodyResident;

  /** Model the frame shows. */
  model: ConnectedBodyModel;

  /** Declared physical vertex incidence of each part, in part order. */
  physical: ConnectedBodyPart["geometry"]["mesh"]["physicalVertices"][];
}
