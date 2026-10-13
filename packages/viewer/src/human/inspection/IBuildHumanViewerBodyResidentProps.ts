import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { HumanResidentPort } from "@automovie/viewer/human/common/HumanResidentPort";

import type { createHumanViewerViewportHost } from "./createHumanViewerViewportHost.js";

/**
 * What a body or whole-person resident is built from.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 *
 * @evidence contracts/common.md#principled-implementation A document and its typed numerical port are bound to the viewport host that owns the resulting resident.
 * @evidence contracts/common.md#clear-and-simple-design Optional serialization accommodates Person text while preview and construction remain explicit product operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The input selects the existing Body or Person operation instead of substituting a viewer-specific model.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-document A document and its typed numerical port are bound to the viewport host that owns the resulting resident.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document The input selects the existing Body or Person operation instead of substituting a viewer-specific model.
 *
 * @author Samchon
 */
export interface IBuildHumanViewerBodyResidentProps<Document> {
  /**
   * The viewport host the resident owns.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Binds the resulting Body or Person resident to the supplied viewport host's control and disposal lifetime.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Binds the resulting Body or Person resident to the supplied viewport host's control and disposal lifetime.
   */
  host: ReturnType<typeof createHumanViewerViewportHost>;

  /**
   * The body or person document.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Supplies the original typed Body or Person document to its product numerical owner without a viewer-only model schema.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Supplies the original typed Body or Person document to its product numerical owner without a viewer-only model schema.
   */
  document: Document;

  /**
   * Use the existing product construct entry and retain its admission report.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Distinguishes explicit construction from the omitted preview operation without converting rejected construction into preview.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Distinguishes explicit construction from the omitted preview operation without converting rejected construction into preview.
   */
  operation?: "preview" | "construct";

  /**
   * The document's text form, when it is not a body basis document.
   *
   * @evidence contracts/common.md#principled-implementation The optional encoder supplies the document text consumed by the same Body or Person numerical port.
   * @evidence contracts/common.md#clear-and-simple-design Only document serialization varies while viewport construction remains shared.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Encoding the supplied document does not replace the numerical result or admission path.
   * @evidence contracts/common.md#meaningful-documentation Omission retains the body document's normal serializer; Person may supply its own text form.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-document The optional encoder supplies the document text consumed by the same Body or Person numerical port.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Omission retains the body document's normal serializer; Person may supply its own text form.
   */
  serialize?: (document: Document) => string;

  /**
   * Open the numerical port for this document.
   *
   * @evidence contracts/common.md#principled-implementation The factory opens a typed Body request/result port for this resident.
   * @evidence contracts/common.md#clear-and-simple-design Numerical lifetime is provided independently of the viewport host.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The port carries original product messages rather than a viewer-only numerical producer.
   * @evidence contracts/common.md#meaningful-documentation The returned port belongs to this document's numerical connection and is released with its resident.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-document The factory opens a typed Body request/result port for this resident.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document The returned port belongs to this document's numerical connection and is released with its resident.
   */
  worker: () => HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult>;
}
