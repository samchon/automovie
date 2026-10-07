import type { ConnectedFaceRequest } from "../common/ConnectedFaceRequest";
import type { ConnectedFaceResult } from "../common/ConnectedFaceResult";
import type { HumanResidentPort } from "../common/HumanResidentPort";
import type { createConnectedFaceRenderer } from "./connectedRenderer";

/**
 * The preview's worker connection and texture renderer. Numerical evaluation
 * and texture preparation have separate owners under one request generation.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Supplies the resources whose obsolete preview work is cancelled together.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Separates numerical transport from renderer preparation.
 * @author Samchon
 */
export interface IConnectedFacePreviewProps {
  /** Allocate the numerical worker transport on first use or after failure. */
  worker: () => HumanResidentPort<ConnectedFaceRequest, ConnectedFaceResult>;

  /** Prepare and release visible renderer resources for numerical previews. */
  renderer: ReturnType<typeof createConnectedFaceRenderer>;
}
