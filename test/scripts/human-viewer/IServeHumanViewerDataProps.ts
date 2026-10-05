import type { IncomingMessage, ServerResponse } from "node:http";

import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue";
import type { IHumanViewerBasisFiles } from "./IHumanViewerBasisFiles";
import type { IHumanViewerGenerationFiles } from "./IHumanViewerGenerationFiles";

/**
 * One request and the host state the data routes read or publish.
 *
 * @evidence contracts/common.md#clear-and-simple-design The host supplies paths, the settled catalogue and publication; the routes own no state.
 * @evidence contracts/common.md#meaningful-documentation Names every input of the data routes.
 * @author Samchon
 */
export interface IServeHumanViewerDataProps {
  /** Parsed request URL. */
  url: URL;

  /** The request. */
  request: IncomingMessage;

  /** Its response. */
  response: ServerResponse;

  /** Repository root. */
  root: string;

  /** `.shots/human-viewer` storage directory. */
  storage: string;

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
   * Asks waiting admissions again, then re-reads the catalogue until every
   * sidecar read and page admission it started has finished, and resolves
   * with that catalogue.
   */
  settleInputs: () => Promise<IHumanViewerCatalogue>;
}
