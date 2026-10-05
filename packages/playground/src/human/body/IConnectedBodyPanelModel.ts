import type { IAutoMovieModelCrossing } from "@automovie/engine";

import type { IConnectedBodyPreviewResult } from "./IConnectedBodyPreviewResult";

/**
 * What the connected body panel reads of a built model: its part count and,
 * when the viewport measured them, crossings, the anatomy reading and extras.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Exposes the part count and contact reading the editor reports for each committed body.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Carries the worker's crossings, anatomy reading and extras alongside the published model.
 * @author Samchon
 */
export interface IConnectedBodyPanelModel {
  /** The number of material regions drawn. */
  parts: number;

  /** Triangle crossings, when measured. */
  crossings?: IAutoMovieModelCrossing[] | null;

  /** The anatomy reading, when requested. */
  anatomy?: IConnectedBodyPreviewResult["anatomy"];

  /** Runtime extras (bones, landmarks). */
  extras?: Record<string, unknown>;
}
