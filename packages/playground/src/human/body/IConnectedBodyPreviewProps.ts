import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";

import type { HumanResidentPort } from "../common/HumanResidentPort";
import type { ConnectedBodyRequest } from "./ConnectedBodyRequest";
import type { ConnectedBodyResult } from "./ConnectedBodyResult";
import type { createConnectedBodyRenderer } from "./connectedBodyRenderer";

/**
 * Inputs of `createConnectedBodyPreview`.
 *
 * `worker` starts the one resident worker kept alive across edits, and
 * `renderer` prepares and publishes its frames. `serialize` writes a document
 * for the worker; omitted, the document is a body basis document.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Supplies the resident worker and renderer that keep body previews correlated with edits.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Names the worker port, frame renderer and document serialization the preview transaction uses.
 * @author Samchon
 */
export interface IConnectedBodyPreviewProps<
  Document extends
    | IAutoMovieHumanBodyBasisDocument
    | IAutoMovieHumanPersonDocument = IAutoMovieHumanBodyBasisDocument,
> {
  /** Actual loaded source authority for body-only auxiliary transactions such as arms-down solving. */
  source?: IAutoMovieHumanBodyAnatomicalAssembly;

  /** Start the resident worker port. */
  worker: () => HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult>;

  /** Renderer that prepares and publishes the worker's frames. */
  renderer: ReturnType<typeof createConnectedBodyRenderer>;

  /** Text of a document for the worker; a body document unless the stage draws people. */
  serialize?: (document: Document) => string;
}
