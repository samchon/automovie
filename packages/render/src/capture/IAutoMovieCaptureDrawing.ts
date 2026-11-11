import type { IAutoMovieRasterImage } from "../picture/IAutoMovieRasterImage.js";

/**
 * What a host's draw function returns for one cell: the picture, the anchors of the labels to stamp on it, and what drew it.
 *
 * The capture stamps each label on the still, records the backend and the resolved camera beside the cell, and compares two rounds' stills pixel by pixel only when both name the same backend.
 *
 * @evidence contracts/development/design.md#principled-representation The picture in the raster tools' own record, label anchors in the picture's pixels from its top-left corner, and two identities, the renderer that drew it and the camera it resolved, which `.agents/skills/visual-debugging/capture.md` asks a record to keep so an observation repeats.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the run (picture, labels) and the record and comparison (backend, camera); drawing itself is the host's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent backend or camera is recorded as not stated, never as a guessed default, and a comparison treats an unstated backend as differing.
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
  labels: IAutoMovieCaptureDrawing.ILabel[];

  /**
   * Identity of the renderer that drew the still, such as `swiftshader` or a GPU name; absent when the host does not state it.
   */
  backend?: string;

  /**
   * The camera the view resolved to, as text two rounds compare; a draw page writes the JSON of its `IAutoMovieInspectionCamera`, which holds the projection and up direction a view text cannot. Absent when the host does not state it.
   */
  camera?: string;
}
export namespace IAutoMovieCaptureDrawing {
  /**
   * One label to stamp on a still.
   *
   * @evidence contracts/development/design.md#principled-representation Text and the pixel of the picture where its box starts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, read by the stamp.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A box that would leave the picture is moved inside it by the stamp rather than refused.
   * @evidence contracts/development/common.md#meaningful-documentation States what each member holds and its frame.
   */
  export interface ILabel {
    /** The text; characters outside the stamp's font draw blank. */
    text: string;

    /** Column of the box's top-left corner, in pixels from the left. */
    x: number;

    /** Row of the box's top-left corner, in pixels from the top. */
    y: number;
  }
}
