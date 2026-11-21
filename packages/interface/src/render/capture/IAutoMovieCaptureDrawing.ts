import type { IAutoMovieInspectionDiagnostics } from "../inspection/IAutoMovieInspectionDiagnostics.js";
import type { IAutoMovieRasterImage } from "../picture/IAutoMovieRasterImage.js";
import type { IAutoMovieRasterLabel } from "../picture/IAutoMovieRasterLabel.js";
import type { IAutoMovieCaptureResolution } from "./IAutoMovieCaptureResolution.js";

/**
 * What a host's draw function returns for one cell: the picture, the anchors of the labels to stamp on it, and what drew it.
 *
 * The capture stamps each label on the still, records the backend and the resolved camera beside the cell, and compares two rounds' stills pixel by pixel only when both name the same backend. When supplied, findings and coverage contribute to the capture's audit.
 *
 * @evidence contracts/development/design.md#principled-representation The picture in the raster tools' own record, label anchors in the picture's pixels from its top-left corner, and two identities, the renderer that drew it and the camera it resolved, which `.agents/skills/visual-debugging/capture.md` asks a record to keep so an observation repeats.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the run (picture, labels) and the record (backend, camera, resolved patterns, diagnostics); drawing itself is the host's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent backend, camera or resolution is recorded as not stated, never as a guessed default, and a comparison treats an unstated backend as differing.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, what the capture does with each member, the anchor frame and what an absent identity means.
 */
export interface IAutoMovieCaptureDrawing {
  /**
   * The drawn still, at the subject's raster.
   */
  picture: IAutoMovieRasterImage;

  /**
   * Labels to stamp, each with the pixel of the picture where its box's top-left corner goes, such as the anchor of a mark.
   */
  labels: IAutoMovieRasterLabel[];

  /**
   * Identity of the renderer that drew the still, such as `swiftshader` or a GPU name; absent when the host does not state it.
   */
  backend?: string;

  /**
   * The resolved camera as text two rounds compare; a draw page writes the JSON of its `IAutoMovieInspectionCamera`. The separate repeat text encodes the supported fixed-view fields, including orthographic scale and up direction, without promising arbitrary lens or clip settings. Absent when the host does not state it.
   */
  camera?: string;

  /**
   * The view text that draws the resolved camera again, a fixed view as `formatAutoMovieInspectionCameraView` writes it, which a later round copies as is; absent when the host does not state it.
   */
  repeat?: string;

  /**
   * What each pattern of the cell's request and view resolved to, as `resolveAutoMovieCapturePatterns` gives it on the draw page; absent when the host does not state it.
   */
  resolved?: IAutoMovieCaptureResolution[];

  /** Findings and coverage from this drawing's evaluated sample, when the host supplies them. */
  diagnostics?: IAutoMovieInspectionDiagnostics;
}
