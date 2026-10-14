import type { IncomingMessage, ServerResponse } from "node:http";

import type { IHumanViewerBasisFiles } from "./IHumanViewerBasisFiles.js";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { IHumanViewerGenerationFiles } from "./IHumanViewerGenerationFiles.js";

/**
 * One request and the host state the data routes read or publish.
 *
 * @evidence contracts/common.md#principled-implementation Data routes receive request-scoped catalogue authority plus distinct published basis, generation-view, reference and mutable-storage locations.
 * @evidence contracts/common.md#clear-and-simple-design Dispatch composes specialized data owners while host callbacks retain catalogue publication, selected admission and source-generation proof.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reference photographs remain display-only inputs and selected descriptors cannot bypass their numerical owner's admission.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish mutable storage from existing photographs, request-scoped inventory, document-only settlement and current-code token checks.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The data-route binding selects no sidecar scanning, file streaming or catalogue rebuilding algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Host callbacks reuse stamped metadata and matching-key admissions; currentCode additionally checks the candidate token against live source authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Routes borrow the HTTP request/response and source metadata; stream, admission and generation owners retain their own resources until actual settlement.
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

  /**
   * Publish a rescanned catalogue to the host.
   *
   * @evidence contracts/common.md#principled-implementation Publication replaces host catalogue authority with the completed rescan result rather than mutating a request's prior snapshot.
   * @evidence contracts/common.md#clear-and-simple-design The data route returns discovery work through the host's existing publication operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the actual rescan result is published; refusal and pending records remain part of its catalogue.
   * @evidence contracts/common.md#meaningful-documentation The member states that the host receives the rescanned catalogue.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The publication signature chooses no rescan, diff or source-hash algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Catalogue publication has observable host effects and is not interchangeable merely because two catalogue objects compare equal.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The host owns the published catalogue slot; this callback transfers no admitted resident or stream handle.
   */
  publish: (inventory: IHumanViewerCatalogue) => void;

  /**
   * Encode a data-route result as JSON and end this HTTP response.
   *
   * @evidence contracts/common.md#principled-implementation Data results are serialized through the server's response writer using the route's actual returned value.
   * @evidence contracts/common.md#clear-and-simple-design One borrowed writer keeps HTTP serialization outside individual catalogue and basis route implementations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Metadata and refusal values remain intact rather than being replaced with canned successful data answers.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies JSON encoding and completion of this data response.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This data writer declaration does not select JSON traversal or network buffering strategies.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each data response is a separate transport effect even when its serialized metadata matches another request.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The HTTP owner retains response-write state; the borrowed JSON callback acquires no stream itself.
   */
  json: (value: unknown) => void;

  /**
   * Asks waiting admissions again, then re-reads the catalogue until every sidecar read and page admission it started has finished, and resolves with that catalogue.
   *
   * @evidence contracts/common.md#principled-implementation Repeated catalogue reads stop only when the sidecar/admission owners report no outstanding work initiated by discovery.
   * @evidence contracts/common.md#clear-and-simple-design The host owns the discovery/settlement loop while the rescan route awaits its completed catalogue.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Pending tasks are not marked complete merely after one asynchronous pass or an arbitrary delay.
   * @evidence contracts/common.md#meaningful-documentation The comment specifies renewed admissions, repeated reads and the all-started-work completion condition.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The catalogue-settlement capability chooses no task-joining or reread-loop implementation.
   * @evidence contracts/performance.md#reuse-equivalent-work Rereads reuse unchanged file facts and entry parsing while reapplying owner admission as pending work completes.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Background owners retain sidecar/admission tasks until settlement; this wait borrows their completion and returns the resulting catalogue.
   */
  settleInputs: () => Promise<IHumanViewerCatalogue>;

  /**
   * Select the requested descriptor for domain admission. Owning JSON is still parsed in full, and projection can inspect other array members or source-group inputs before selecting that descriptor or refusing the read.
   *
   * @evidence contracts/common.md#principled-implementation Selection narrows the requested numerical admission; source readers still parse the owning JSON and project their supported input population before filtering or refusal.
   * @evidence contracts/common.md#clear-and-simple-design The data route borrows selection-aware catalogue reading while file parsing and input projection remain with their existing owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A selected descriptor still receives pending or refused owner outcomes; selection is not an admission bypass.
   * @evidence contracts/common.md#meaningful-documentation The member distinguishes selected admission from whole-file parsing and projection, including refusal before a matching array entry is reached.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This selected-read signature defines no filename indexing or per-domain parser algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work Selected reads may reuse matching stamped file results and document-key admission while leaving unrelated input work untouched.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The catalogue controller owns any started domain work; the route receives metadata without taking numerical session ownership.
   */
  readDocument: (doc: string) => IHumanViewerCatalogue;

  /**
   * Await only the requested document's own sidecars and admission.
   *
   * @evidence contracts/common.md#principled-implementation Document settlement waits for the selected input's actual sidecar facts and owner verdict before returning its catalogue state.
   * @evidence contracts/common.md#clear-and-simple-design Selected readiness is one host operation distinct from the full-input rescan settlement loop.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unrelated pending documents are not required to settle, and the requested document is not silently accepted while its own work runs.
   * @evidence contracts/common.md#meaningful-documentation The comment names the document-specific sidecar and admission wait boundary.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This per-document wait contract specifies no task lookup or Promise scheduling strategy.
   * @evidence contracts/performance.md#reuse-equivalent-work The host shares matching in-flight facts/verdicts for the selected authority and does not restart unchanged work solely for another read.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Selected task owners hold their work until actual completion; the waiting data route owns no independent worker handle.
   */
  settleDocument: (doc: string) => Promise<IHumanViewerCatalogue>;

  /**
   * Whether the frame with this generation token runs the current revision's code.
   *
   * @evidence contracts/common.md#principled-implementation Candidate code authority is checked from its generation token's proven source label against the current revision.
   * @evidence contracts/common.md#clear-and-simple-design The route asks the generation/source owner for proof instead of inferring it from request-supplied revision text.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing, unknown or unproven tokens cannot certify current code merely by naming a desired source revision.
   * @evidence contracts/common.md#meaningful-documentation The member distinguishes candidate-token code proof from current revision intent.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This predicate selects no source-witness or window-labeling algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work Proof remains valid only while the token's observed label matches current authority; source invalidation changes the comparison result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The predicate borrows generation proof without opening a new source hold or retaining its response connection.
   */
  currentCode: (token: string | null) => boolean;
}
