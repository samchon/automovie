import type { IncomingMessage, ServerResponse } from "node:http";

import type { IHumanViewerBasisFiles } from "./IHumanViewerBasisFiles.js";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { IHumanViewerGenerationFiles } from "./IHumanViewerGenerationFiles.js";

/**
 * One request and the host state the data routes read or publish.
 *
 * @evidence contracts/common.md#principled-implementation Data routes distinguish selected storage, read-only photographs, published source paths and the catalogue used for each request.
 * @evidence contracts/common.md#clear-and-simple-design The host owns mutable publication and admission operations while the route owns response handling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Token-based code freshness and per-document settlement remain explicit rather than inferred from a successful response.
 * @evidence contracts/common.md#meaningful-documentation Documents request paths, storage/reference boundaries, catalogue publication and targeted versus complete input settlement.
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

  /**
   * Publishes a rescanned catalogue to the host.
   *
   * @evidence contracts/common.md#principled-implementation Catalogue publication supplies the fully rescanned inventory to the host.
   * @evidence contracts/common.md#clear-and-simple-design The route requests publication while mutable server catalogue ownership stays with the host.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Publication does not fabricate admission verdicts for entries that remain pending.
   * @evidence contracts/common.md#meaningful-documentation Names the replacement catalogue passed to the publication owner.
   */
  publish: (inventory: IHumanViewerCatalogue) => void;

  /**
   * Answers with a JSON value.
   *
   * @evidence contracts/common.md#principled-implementation Data-route JSON output sends the response value selected for this request.
   * @evidence contracts/common.md#clear-and-simple-design Serialization stays with the HTTP host rather than the data-state record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Response transmission cannot turn pending catalogue data into admitted output.
   * @evidence contracts/common.md#meaningful-documentation Defines the data route's JSON response callback.
   */
  json: (value: unknown) => void;

  /**
   * Asks waiting admissions again, then re-reads the catalogue until every sidecar read and page admission it started has finished, and resolves with that catalogue.
   *
   * @evidence contracts/common.md#principled-implementation Complete settlement repeats pending admissions and catalogue reads until work it started has finished.
   * @evidence contracts/common.md#clear-and-simple-design The host owns sidecar acquisition and admission ordering behind one asynchronous operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Settling input work does not certify an unread or rejected document as successful.
   * @evidence contracts/common.md#meaningful-documentation Documents complete input settlement and its resulting catalogue.
   */
  settleInputs: () => Promise<IHumanViewerCatalogue>;

  /**
   * Read just the requested descriptor, starting only its domain admission.
   *
   * @evidence contracts/common.md#principled-implementation Descriptor reading starts only the requested document's own domain admission.
   * @evidence contracts/common.md#clear-and-simple-design The host owns selected-input resolution while the route supplies the document address.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reading one descriptor does not eagerly start every unrelated catalogue document.
   * @evidence contracts/common.md#meaningful-documentation Defines the targeted descriptor read and returned catalogue.
   */
  readDocument: (doc: string) => IHumanViewerCatalogue;

  /**
   * Await only the requested document's own sidecars and admission.
   *
   * @evidence contracts/common.md#principled-implementation Document settlement awaits only the selected document's sidecars and admission.
   * @evidence contracts/common.md#clear-and-simple-design The host retains the document-specific asynchronous admission lifecycle.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A requested document cannot acquire another input's generation authority through global settlement.
   * @evidence contracts/common.md#meaningful-documentation Documents targeted sidecar/admission completion and its catalogue result.
   */
  settleDocument: (doc: string) => Promise<IHumanViewerCatalogue>;

  /**
   * Whether the frame with this generation token runs the current revision's code.
   *
   * @evidence contracts/common.md#principled-implementation Code freshness checks whether the supplied generation token belongs to the current source revision.
   * @evidence contracts/common.md#clear-and-simple-design The host owns token-to-revision authority while the route asks the freshness question.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A loaded old frame is not relabelled current from HTTP readiness or image appearance.
   * @evidence contracts/common.md#meaningful-documentation Defines the nullable token input and current-code predicate.
   */
  currentCode: (token: string | null) => boolean;
}
