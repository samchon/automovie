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
 */
export interface IConnectedBodyFrame {
  /** Resident group the frame publishes into. */
  resident: IConnectedBodyResident;

  /** Model the frame shows. */
  model: ConnectedBodyModel;

  /** Declared physical vertex incidence of each part, in part order. */
  physical: ConnectedBodyPart["geometry"]["mesh"]["physicalVertices"][];
}
