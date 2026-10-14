import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";

import type { HumanResidentPort } from "../common/HumanResidentPort.js";
import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { createConnectedBodyRenderer } from "./createConnectedBodyRenderer.js";

/**
 * Inputs of `createConnectedBodyPreview`.
 *
 * The preview owns the lazily acquired resident connection. Its renderer is
 * borrowed; the viewport closes it after retiring published and prepared frames.
 * Person documents require their own serializer; the default writes body basis documents.
 *
 * @evidence contracts/common.md#principled-implementation The generic document stays numerical and the worker receives serialized text. The default serializer casts to a body basis document, so a person consumer must supply the matching serializer rather than relying on the generic constraint to choose one.
 * @evidence contracts/common.md#clear-and-simple-design Worker transport, frame preparation and source-backed auxiliary requests meet at one preview input record; browser and GPU service acquisition belong to its viewport host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional source authority is passed to body arms-down serialization; it is loaded product data, not a fixture-specific geometry override. No consumer identity changes serialization behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes a transferred connection from a borrowed renderer, the body-only serializer default, and the purpose of optional source authority.
 * @evidence contracts/performance.md#efficient-algorithms The record itself performs no traversal. Serialization scales with document text and preparation with the returned model; the preview implementation owns those costs.
 * @evidence contracts/performance.md#reuse-equivalent-work A single preview reuses its resident worker across edits, while each request carries its actual serialized document. Renderer identity and loaded source remain stable dependencies of that preview.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The preview retains these service references until its viewport releases it. The worker is acquired on the first request and terminated by disposeWorker; this type neither starts nor closes borrowed renderer resources.
 *
 * @author Samchon
 */
export interface IConnectedBodyPreviewProps<
  Document extends
    | IAutoMovieHumanBodyBasisDocument
    | IAutoMovieHumanPersonDocument = IAutoMovieHumanBodyBasisDocument,
> {
  /** Actual loaded source authority for body-only auxiliary transactions such as arms-down solving. */
  source?: IAutoMovieHumanBodyAnatomicalAssembly;

  /**
   * Acquire a resident numerical connection whose termination transfers to the preview.
   *
   * @evidence contracts/common.md#principled-implementation The factory returns the typed request/reply port expected by createHumanResidentWorker; its callbacks must implement that correlation protocol.
   * @evidence contracts/common.md#clear-and-simple-design A zero-argument factory keeps lazy acquisition and reconnection in the worker coordinator instead of acquiring a browser worker while assembling props.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The actual consumer supplies a numerical port; this callback does not replace a foreign worker method or select a test transport internally.
   * @evidence contracts/common.md#meaningful-documentation The comment states that the returned connection transfers termination authority rather than remaining a borrowed host service.
   * @evidence contracts/performance.md#efficient-algorithms Factory cost belongs to the host implementation. The coordinator invokes it only when there is no current connection, rather than once per successful edit.
   * @evidence contracts/performance.md#reuse-equivalent-work The same live connection serves correlated requests until transport failure or disposal; successful retirement permits lazy replacement and failed retirement refuses it, without treating matching document text as equivalent effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One current connection is retained by the coordinator and terminated on transport failure or preview disposal. Pending request count is not bounded by this function type.
   */
  worker: () => HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult>;

  /** Renderer that prepares and publishes the worker's frames. */
  renderer: ReturnType<typeof createConnectedBodyRenderer>;

  /**
   * Serialize this preview's document family; omission selects the body basis serializer.
   *
   * @evidence contracts/common.md#principled-implementation The callback writes the numerical document grammar admitted by the supplied worker. Person consumers must supply person serialization because the fallback is specifically body basis serialization.
   * @evidence contracts/common.md#clear-and-simple-design One optional serializer supports the two existing document families without moving their grammar into the GPU renderer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Document family is an explicit caller choice, not an inferred consumer name or fixture branch. Serializer validation and thrown errors remain authoritative.
   * @evidence contracts/common.md#meaningful-documentation The comment gives the optional-state meaning and the required match between serializer and worker document family.
   * @evidence contracts/performance.md#efficient-algorithms Each invocation allocates text proportional to the admitted document; no complexity or byte bound is imposed on a custom serializer by this type.
   * @evidence contracts/performance.md#reuse-equivalent-work Serialization runs for each preview or export request because validation and custom callback effects may differ; this field declares no result cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The preview retains the callback and request text until their owning requests settle. The callback returns text, not a resource requiring a disposer.
   */
  serialize?: (document: Document) => string;
}
