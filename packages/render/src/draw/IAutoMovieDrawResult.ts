import type { IAutoMovieCaptureResolution } from "../capture/IAutoMovieCaptureResolution.js";
import type { IAutoMovieInspectionCamera } from "../scene/inspection/IAutoMovieInspectionCamera.js";
import type { IAutoMovieInspectionLegendEntry } from "../scene/inspection/IAutoMovieInspectionLegendEntry.js";

/**
 * What a draw page returns for one `IAutoMovieDrawCall`: the picture as base64 RGBA rows from the top, the labels to stamp, the legend of the marks drawn, the camera the view resolved to, and the paths each pattern resolved to.
 *
 * It crosses out of the page as JSON, so the picture is text; `decodeAutoMovieDrawPixels` turns it back into a raster on the host.
 *
 * @evidence contracts/development/design.md#principled-representation The picture is the call's raster in bytes, four per pixel, rows from the top, written as base64 because the transport carries strings; labels are picture pixels from the top-left; the legend and the camera are the inspection core's records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `AutoMovieDrawSession`, which checks the size, stamps the legend and the labels through the capture run and records the camera and the resolved patterns.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The size is stated beside the bytes so a short or long picture is refused, never cropped or padded.
 * @evidence contracts/development/common.md#meaningful-documentation States the transport, the byte layout, the label frame and who reads each member.
 */
export interface IAutoMovieDrawResult {
  /** Base64 of `width * height * 4` RGBA bytes, rows from the top. */
  pixels: string;

  /** Picture width in pixels. */
  width: number;

  /** Picture height in pixels. */
  height: number;

  /** Labels the inspection placed, each with the pixel of its box's top-left corner. */
  labels: {
    /** The label's text. */
    text: string;

    /** Pixels from the left edge. */
    x: number;

    /** Pixels from the top edge. */
    y: number;
  }[];

  /** One entry per colour of the marks in the picture with its count, then the surface colours of the faces shade, as the applied inspection lists them. */
  legend: IAutoMovieInspectionLegendEntry[];

  /** The camera the view resolved to. */
  camera: IAutoMovieInspectionCamera;

  /** What each pattern of the call's request and view resolved to among the scene's object paths and the paths of the marks it drew: topmost paths and counts, never geometry. */
  resolved: IAutoMovieCaptureResolution[];
}
