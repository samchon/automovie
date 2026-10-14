import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type { IConnectedBodyPreviewResult } from "@automovie/human/body/runtime/IConnectedBodyPreviewResult";

/**
 * What the connected body panel reads of a built model: its part count and, when the viewport measured them, crossings, the anatomy reading and extras. Optional readings are absent when the preview did not request them. A missing or null crossings field is not a claim that the mesh has no crossings; the panel reports counts only for an actual array.
 *
 * @evidence contracts/common.md#principled-implementation The panel reads a projection of preview output rather than recomputing geometry; optional measurements preserve the distinction between unavailable inspection and an observed empty result.
 * @evidence contracts/common.md#clear-and-simple-design Geometry remains with the viewport, while this narrow model exposes only status and inspection fields the body panel consumes from the numerical preview.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional crossings and anatomy readings are not replaced with fabricated success reports; unrequested quantities remain explicitly absent.
 * @evidence contracts/common.md#meaningful-documentation Comments identify part count, measured readings and runtime extras, including why omitted or null crossing data cannot establish a crossing-free model.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This panel-facing view declares no triangle-intersection or anatomical algorithm; its fields reference the measurements already produced by the preview.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The model projection stores no cache key and coordinates no repeated preview; document and viewport owners decide when inspection data remains current.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Inspection arrays and extras are borrowed preview data, with no renderer handles acquired by this structural panel interface.
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
