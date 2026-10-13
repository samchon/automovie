import type { IAutoMovieModelCrossing } from "@automovie/engine";

import type { IConnectedBodyPreviewResult } from "@automovie/human/body/runtime/IConnectedBodyPreviewResult";

/**
 * The part of a built person preview the person panel reads: how many
 * material regions the committed model has, and on an explicit check the
 * body skin's crossings and humeral-head reading. The viewport owns the prepared
 * frame behind it.
 *
 * @author Samchon
 */
export interface IConnectedPersonModel {
  /** Material regions of the built person. */
  parts: number;

  /** Body skin crossings, when a check asked for them. */
  crossings?: IAutoMovieModelCrossing[] | null;

  /** Humeral-head reading, when a check asked for it. */
  anatomy?: IConnectedBodyPreviewResult["anatomy"];

  /** Geometric foot-to-ground readings requested on the same body build. */
  groundSupport?: IConnectedBodyPreviewResult["groundSupport"];
}
