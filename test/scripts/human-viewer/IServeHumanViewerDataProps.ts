import type { IncomingMessage, ServerResponse } from "node:http";

import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import type { IHumanViewerBasisFiles } from "./IHumanViewerBasisFiles";

/**
 * One request and the host state the data routes read or publish.
 *
 * @evidence contracts/common.md#clear-and-simple-design The host supplies paths, catalogue and publication; the routes own no state.
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

  /** Directory of hand-written inputs. */
  inputsDirectory: string;

  /** Catalogue the request is answered against. */
  inventory: HumanViewerCatalogue;

  /** Reads a fresh catalogue for a rescan. */
  catalogue: () => HumanViewerCatalogue;

  /** Publishes a rescanned catalogue to the host. */
  publish: (inventory: HumanViewerCatalogue) => void;

  /** Answers with a JSON value. */
  json: (value: unknown) => void;
}
