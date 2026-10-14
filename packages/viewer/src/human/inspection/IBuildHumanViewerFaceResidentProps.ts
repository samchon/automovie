import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";
import type { ConnectedFaceRequest } from "@automovie/human/face/runtime/ConnectedFaceRequest";
import type { ConnectedFaceResult } from "@automovie/human/face/runtime/ConnectedFaceResult";
import type { HumanResidentPort } from "@automovie/viewer/human/common/HumanResidentPort";

import type { createHumanViewerViewportHost } from "./createHumanViewerViewportHost.js";

/**
 * What a face resident is built from.
 *
 * @evidence contracts/common.md#principled-implementation The face resident delegates this document, AO flag and transport to createConnectedFaceViewport, preserving explicit construct versus default preview semantics.
 * @evidence contracts/common.md#clear-and-simple-design Collects face-specific inputs separately from the body/person serializer and lets the face owner produce geometry and admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts AO changes the actual face build request; the adapter does not insert geometry or synthesize periocular admission from a successful frame.
 * @evidence contracts/common.md#meaningful-documentation States AO purpose, preview default and construct inspection; resident controls are owned while the shared page renderer remains borrowed.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input type performs no work; the consumer builds the face, prepares GPU objects and accounts group and witness-array bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work One viewport receives these bindings; valid cache reuse still depends on face document, AO request, basis and builder source rather than this object identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The stage retains face state until resident release, closing the acquired connection independently of host control release; no per-interface population cap is imposed.
 *
 * @author Samchon
 */
export interface IBuildHumanViewerFaceResidentProps {
  /** Resident-owned controls and resize hooks over the page's borrowed renderer, canvas and loader. */
  host: ReturnType<typeof createHumanViewerViewportHost>;

  /** The face document. */
  document: IAutoMovieHumanFaceBasisDocument;

  /** Whether ambient occlusion is evaluated. */
  ao: boolean;

  /**
   * Explicit owner construction inspection; omission retains admitted preview.
   */
  operation?: "preview" | "construct";

  /**
   * Open the numerical port for this document.
   *
   * @evidence contracts/common.md#principled-implementation Provides the actual ConnectedFaceRequest/Result transport for the face viewport, with acquisition deferred to its numerical owner.
   * @evidence contracts/common.md#clear-and-simple-design Separates face protocol connection creation from AO selection, scene publication and resident accounting.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A transport may use a browser worker or checked Node connection; neither its existence nor a draw proves physiological admission.
   * @evidence contracts/common.md#meaningful-documentation The supplied factory is borrowed, but the stage owns closure of the connection it acquires, including a rejected face build.
   * @evidence contracts/performance.md#efficient-algorithms Connection setup cost follows the chosen transport; subsequent face requests carry document-sized input and produced model data.
   * @evidence contracts/performance.md#reuse-equivalent-work One stage retains its acquired connection for numerical requests; wider sharing and source invalidation belong to the supplied transport factory.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Stage.close retires the connection; the props record acquires no native worker and retains only a callback until its resident can be collected.
   */
  worker: () => HumanResidentPort<ConnectedFaceRequest, ConnectedFaceResult>;
}
