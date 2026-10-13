import type { IncomingMessage, ServerResponse } from "node:http";

import type { IHumanViewerBasisFiles } from "./IHumanViewerBasisFiles.js";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { IHumanViewerGenerationFiles } from "./IHumanViewerGenerationFiles.js";

/**
 * One request and the host state the data routes read or publish.
 *
 * @author Samchon
 */
export interface IServeHumanViewerDataProps {
  /** Parsed request URL. */
  url: URL;

  /** The request. */
  request: IncomingMessage;

  /** Its response. */
  response: ServerResponse;

  /** Resolved mutable viewer storage directory. */
  storage: string;

  /**
   * Existing local input photographs, read independently of mutable storage.
   */
  referenceDirectory: string;

  /**
   * Application-owned observation camera pose file, independent of numerical basis inputs.
   */
  cameraPosesFile: string;

  /** Published basis files. */
  basisFiles: IHumanViewerBasisFiles;

  /** Published person generation views. */
  generationFiles: IHumanViewerGenerationFiles;

  /** Directory of hand-written inputs. */
  inputsDirectory: string;

  /** Catalogue the request is answered against. */
  inventory: IHumanViewerCatalogue;

  /** Publishes a rescanned catalogue to the host. */
  publish: (inventory: IHumanViewerCatalogue) => void;

  /** Answers with a JSON value. */
  json: (value: unknown) => void;

  /**
   * Asks waiting admissions again, then re-reads the catalogue until every sidecar read and page admission it started has finished, and resolves with that catalogue.
   */
  settleInputs: () => Promise<IHumanViewerCatalogue>;

  /** Read just the requested descriptor, starting only its domain admission. */
  readDocument: (doc: string) => IHumanViewerCatalogue;

  /** Await only the requested document's own sidecars and admission. */
  settleDocument: (doc: string) => Promise<IHumanViewerCatalogue>;

  /**
   * Whether the frame with this generation token runs the current revision's code.
   */
  currentCode: (token: string | null) => boolean;
}
