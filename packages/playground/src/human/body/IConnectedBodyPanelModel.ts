import type { IAutoMovieModelCrossing } from "@automovie/engine";

import type { IConnectedBodyPreviewResult } from "@automovie/human/body/runtime/IConnectedBodyPreviewResult";

/**
 * What the connected body panel reads of a built model: its part count and,
 * when the viewport measured them, crossings, the anatomy reading and extras.
 *
 * @author Samchon
 */
export interface IConnectedBodyPanelModel {
  /** The number of material regions drawn. */
  parts: number;

  /** Triangle crossings, when measured. */
  crossings?: IAutoMovieModelCrossing[] | null;

  /** The anatomy reading, when requested. */
  anatomy?: IConnectedBodyPreviewResult["anatomy"];

  /** The femoral head target reading, when requested. */
  femoralHeads?: IConnectedBodyPreviewResult["femoralHeads"];

  /** Each foot's ground gap, when requested. */
  groundSupport?: IConnectedBodyPreviewResult["groundSupport"];

  /** Runtime extras (bones, landmarks). */
  extras?: Record<string, unknown>;
}
