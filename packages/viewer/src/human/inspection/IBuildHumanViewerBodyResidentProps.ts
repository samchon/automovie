import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { HumanResidentPort } from "@automovie/viewer/human/common/HumanResidentPort";

import type { createHumanViewerViewportHost } from "./createHumanViewerViewportHost.js";

/**
 * What a body or whole-person resident is built from.
 *
 * @evidence contracts/common.md#principled-implementation The body/person resident passes this borrowed document and viewport bindings to createConnectedBodyViewport; only operation construct requests the construction admission and rig readings.
 * @evidence contracts/common.md#clear-and-simple-design Keeps document serialization, numerical connection acquisition and viewport controls together without implementing a second body builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preview does not manufacture construction admission; the adapter forwards the actual owner operation and leaves document values unchanged.
 * @evidence contracts/common.md#meaningful-documentation Identifies preview default, serialization of paired-person text and viewport ownership; host controls retire with the resident while page renderer resources remain borrowed.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface erases; buildHumanViewerBodyResident pays numerical construction, GPU preparation and retained-array accounting proportional to the produced model.
 * @evidence contracts/performance.md#reuse-equivalent-work Serialize and worker bindings are passed to one viewport; document/basis/builder equivalence and repeated-build reuse remain with its numerical and resident-cache owners.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The resident retains the supplied document and stage until release; stage close retires its acquired connection and host.release retires controls, without disposing the page renderer here.
 *
 * @author Samchon
 */
export interface IBuildHumanViewerBodyResidentProps<Document> {
  /** Resident-owned controls and resize hooks over the page's borrowed renderer, canvas and loader. */
  host: ReturnType<typeof createHumanViewerViewportHost>;

  /** The body or person document. */
  document: Document;

  /**
   * Use the existing product construct entry and retain its admission report.
   */
  operation?: "preview" | "construct";

  /**
   * The document's text form, when it is not a body basis document.
   *
   * @evidence contracts/common.md#principled-implementation The optional converter supplies the textual document used by the body protocol, allowing paired-person input while the body-basis default converter handles ordinary body documents.
   * @evidence contracts/common.md#clear-and-simple-design Keeps the document-to-text choice at the application binding rather than changing numerical body request types.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The converter must describe the actual supplied document; its returned string is not schema admission or a substitute model.
   * @evidence contracts/common.md#meaningful-documentation Omission uses the viewport's existing body document converter; a custom serializer must preserve the paired document's numerical meaning.
   * @evidence contracts/performance.md#efficient-algorithms Serialization cost and output bytes depend on document size; this signature adds no scan or copy beyond the callback's chosen converter.
   * @evidence contracts/performance.md#reuse-equivalent-work The viewport receives the same converter for its stage; text equality alone does not establish paired basis or builder-source equivalence.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The callback and original document remain reachable through the stage until resident release; the temporary text is owned by each numerical request, with no byte cap here.
   */
  serialize?: (document: Document) => string;

  /**
   * Open the numerical port for this document.
   *
   * @evidence contracts/common.md#principled-implementation Supplies a connection implementing ConnectedBodyRequest/Result to the viewport's numerical owner; it may wrap a browser worker or an existing checked Node session.
   * @evidence contracts/common.md#clear-and-simple-design The factory boundary keeps transport creation outside body mesh publication and byte accounting.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A port-shaped value must implement the real protocol; this type does not replace replies, infer admission from drawing or require a fresh native worker per document.
   * @evidence contracts/common.md#meaningful-documentation The viewport lazily acquires the port and stage.close retires that connection; native allocation policy remains with the supplied factory.
   * @evidence contracts/performance.md#efficient-algorithms Factory acquisition is invoked by the numerical owner when required; body construction and transport costs depend on the actual document and chosen transport.
   * @evidence contracts/performance.md#reuse-equivalent-work The stage retains its acquired connection across its requests; reuse across documents requires the factory's own protocol and source authority.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Once acquired the connection belongs to the stage's close path, including failed builds; this property itself holds only the factory reference and opens no port eagerly.
   */
  worker: () => HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult>;
}
