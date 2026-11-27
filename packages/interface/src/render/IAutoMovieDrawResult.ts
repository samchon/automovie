import type { IAutoMovieSemanticMask } from "./IAutoMovieSemanticMask";
import type { IAutoMovieCaptureResolution } from "./IAutoMovieCaptureResolution";
import type { IAutoMovieInspectionCamera } from "./IAutoMovieInspectionCamera";
import type { IAutoMovieInspectionDiagnostics } from "./IAutoMovieInspectionDiagnostics";
import type { IAutoMovieInspectionLegendEntry } from "./IAutoMovieInspectionLegendEntry";
import type { IAutoMovieRasterLabel } from "./IAutoMovieRasterLabel";
import type { IAutoMovieDrawnMouth } from "./IAutoMovieDrawnMouth";

/**
 * What a draw page returns for one `IAutoMovieDrawCall`: the picture as base64
 * RGBA rows from the top, the labels to stamp, the legend of the marks drawn,
 * the camera the view resolved to, and the paths each pattern resolved to.
 *
 * It crosses out of the page as JSON, so the picture is text;
 * `decodeDrawPixels` turns it back into a raster on the host. A
 * production scene can attach its findings and coverage from the same evaluated
 * sample.
 */
export interface IAutoMovieDrawResult {
  /** Base64 of `width * height * 4` RGBA bytes, rows from the top. */
  pixels: string;

  /** Picture width in pixels. */
  width: number;

  /** Picture height in pixels. */
  height: number;

  /**
   * Labels the inspection placed, each with the pixel of its box's top-left
   * corner.
   */
  labels: IAutoMovieRasterLabel[];

  /**
   * One entry per colour of the marks in the picture with its count, then the
   * surface colours of the faces shade, as the applied inspection lists them.
   */
  legend: IAutoMovieInspectionLegendEntry[];

  /** The camera the view resolved to. */
  camera: IAutoMovieInspectionCamera;

  /**
   * What each pattern of the call's request and view resolved to among the
   * scene's object paths and the paths of the marks it drew: topmost paths and
   * counts, never geometry.
   */
  resolved: IAutoMovieCaptureResolution[];

  /**
   * Findings and coverage from the evaluated sample, when supplied by the
   * subject.
   */
  diagnostics?: IAutoMovieInspectionDiagnostics;

  /**
   * For the `mask` shade only: the semantic palette attached to the scene,
   * which `applyRenderMode` painted the mask with, or null when the scene
   * carries none and the mask is the positional ramp. Absent for every other
   * shade. The choice is made in the page, so the page reports it for a host
   * that records the mask's convention.
   */
  semanticMask?: IAutoMovieSemanticMask | null;

  /**
   * The dialogue mouths the subject read while it was placed at the call's
   * second, one per actor in the order first read; absent when the subject took
   * no dialogue mouths.
   */
  mouths?: IAutoMovieDrawnMouth[];
}
