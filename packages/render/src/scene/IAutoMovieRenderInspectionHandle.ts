import type {
  IAutoMovieInspectionFocus,
  IAutoMovieInspectionLabel,
  IAutoMovieInspectionLegendEntry,
  IAutoMovieMark,
} from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieRenderViewerSubjectBounds } from "./IAutoMovieRenderViewerSubjectBounds.js";

/**
 * An inspection applied to a scene: what its colours mean, what it selected,
 * and the calls made while it is in force.
 */
export interface IAutoMovieRenderInspectionHandle {
  /**
   * One entry per colour of the marks in the picture, with the number of marks,
   * then the surface colours of the faces shade.
   */
  legend: IAutoMovieInspectionLegendEntry[];

  /**
   * The distinct paths the request selects: objects in scene order, then the
   * marks drawn in their order. A record of the picture keeps it, so a reader
   * confirms the selection matched what was meant.
   */
  selected: string[];

  /**
   * Bring the shade and the marks to the current pose of the objects inspected
   * at application. Call it after moving those same objects and before drawing.
   * If placement replaces scene objects, restore this handle before placement
   * and apply a fresh inspection to the new graph instead.
   *
   * Given `marks`, the supplied marks are replaced by them first, as a subject
   * whose marks change with time hands over those of the drawn second; the
   * request's patterns select among them as they did at apply, and a kind that
   * matches no pattern is not drawn. The `outline` shells and the `pose`
   * segments move with the scene, and so does every mark.
   *
   * It throws, and keeps the previous marks, when the new marks break the
   * colour law.
   */
  update: (marks?: readonly IAutoMovieMark[]) => void;

  /**
   * Set the size in pixels of the target the picture is drawn into, so a mark's
   * lines are the request's stroke width in that target's pixels. three.js also
   * sets it from the renderer's viewport before every draw; the call serves a
   * reader of the lines before a draw.
   */
  resize: (width: number, height: number) => void;

  /**
   * Place the names the request's `label` patterns ask for on a picture drawn
   * through `camera` at `width` by `height` pixels, with the stamp's font pixel
   * `scale` pixels across: one label per matched drawn object or mark path,
   * anchored at the centre of its drawn box, a label that would overlap one
   * placed before it listed in `dropped`. A host stamps `labels` on its still,
   * and a page places them as elements, so both show the same labels at the
   * same places.
   */
  labels: (
    camera: THREE.Camera,
    width: number,
    height: number,
    scale: number,
  ) => {
    labels: IAutoMovieInspectionLabel[];
    dropped: IAutoMovieInspectionLabel[];
  };

  /**
   * The world-space box of what the inspection leaves drawn now, marks
   * included, or null when nothing is; or, given a view's focus, the box of the
   * drawn objects and marks its pattern matches or of the drawn flagged marks.
   * A view is framed on it.
   *
   * A focus that frames nothing throws, the flagged focus saying no mark is
   * flagged.
   */
  bounds: (
    focus?: IAutoMovieInspectionFocus | null,
  ) => IAutoMovieRenderViewerSubjectBounds | null;

  /**
   * End the inspection: put back every layer, material and clipping state it
   * changed, and remove and release its marks. Calling it again does nothing.
   */
  restore: () => void;
}
