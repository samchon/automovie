import type { IAutoMovieModelCrossing } from "@automovie/engine";

import type { IConnectedBodyPreviewResult } from "../body/IConnectedBodyPreviewResult";

/**
 * The part of a built person preview the person panel reads: how many
 * material regions the committed model has, and on an explicit check the
 * body skin's crossings and humeral-head reading. The viewport owns the prepared
 * frame behind it.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Exposes the material region count the person editor reports for a committed model.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Leaves the prepared frame behind the model with the viewport until publication.
 * @author Samchon
 */
export interface IConnectedPersonModel {
  /** Material regions of the built person. */
  parts: number;

  /** Body skin crossings, when a check asked for them. */
  crossings?: IAutoMovieModelCrossing[] | null;

  /** Humeral-head reading, when a check asked for it. */
  anatomy?: IConnectedBodyPreviewResult["anatomy"];
}
