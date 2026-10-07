import type { IAutoMovieModel } from "@automovie/interface";

import type { ConnectedBodyPart } from "./ConnectedBodyPart";

/** Portable model metadata paired with transferable part geometry.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Keeps the full body visible as one committed preview.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Carries all region buffers and finishes in one preview transaction.
 * @author Samchon
 */
export interface ConnectedBodyModel extends Omit<IAutoMovieModel, "parts"> {
  /** Draw-order parts, each with its own transfer ownership. */
  parts: ConnectedBodyPart[];
}
