import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";
import type { ConnectedFaceRequest } from "@automovie/human/face/runtime/ConnectedFaceRequest";
import type { ConnectedFaceResult } from "@automovie/human/face/runtime/ConnectedFaceResult";
import type { HumanResidentPort } from "@automovie/viewer/human/common/HumanResidentPort";

import type { createHumanViewerViewportHost } from "./createHumanViewerViewportHost.js";

/**
 * What a face resident is built from.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 *
 * @evidence contracts/common.md#principled-implementation Face document, AO choice and original face request/result port reach the same product viewport host.
 * @evidence contracts/common.md#clear-and-simple-design Viewport ownership is supplied once beside explicit preview or construction selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ambient occlusion and construction are authored options; neither depends on an example face identity.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Face document, AO choice and original face request/result port reach the same product viewport host.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Ambient occlusion and construction are authored options; neither depends on an example face identity.
 *
 * @author Samchon
 */
export interface IBuildHumanViewerFaceResidentProps {
  /**
   * The viewport host the resident owns.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Retains the supplied face viewport host as the owner of controls, sizing and release.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Retains the supplied face viewport host as the owner of controls, sizing and release.
   */
  host: ReturnType<typeof createHumanViewerViewportHost>;

  /**
   * The face document.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Supplies the original Face document whose basis and channels the Human runtime admits.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Supplies the original Face document whose basis and channels the Human runtime admits.
   */
  document: IAutoMovieHumanFaceBasisDocument;

  /**
   * Whether ambient occlusion is evaluated.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Carries the caller's explicit ambient-occlusion choice to the same Face build rather than changing document geometry.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Carries the caller's explicit ambient-occlusion choice to the same Face build rather than changing document geometry.
   */
  ao: boolean;

  /**
   * Explicit owner construction inspection; omission retains admitted preview.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Keeps preview and construction selection explicit while omission retains the existing preview path.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Keeps preview and construction selection explicit while omission retains the existing preview path.
   */
  operation?: "preview" | "construct";

  /**
   * Open the numerical port for this document.
   *
   * @evidence contracts/common.md#principled-implementation The factory provides the original Face request/result protocol to the product viewport.
   * @evidence contracts/common.md#clear-and-simple-design A single supplied factory opens the resident's numerical connection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It uses the supported face port without replacing Worker globals or bypassing admission.
   * @evidence contracts/common.md#meaningful-documentation The factory creates a connection owned by the face resident and retired on release.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document The factory provides the original Face request/result protocol to the product viewport.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document The factory creates a connection owned by the face resident and retired on release.
   */
  worker: () => HumanResidentPort<ConnectedFaceRequest, ConnectedFaceResult>;
}
