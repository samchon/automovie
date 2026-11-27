import type { IAutoMovieInspectionLabel } from "@automovie/interface";
import type { IAutoMovieRenderInspectionHandle } from "@automovie/render";
import type * as THREE from "three";

import type { IAutoMovieViewerInspectorScene } from "../IAutoMovieViewerInspectorScene.js";
import type { IAutoMovieViewerInspectorSceneHost } from "../IAutoMovieViewerInspectorSceneHost.js";

/*
 * Place a paused picture's labels and convert them to CSS pixels of the canvas.
 *
 * The inspection places labels on the subject's raster. Positions and the line
 * height scale by the ratio of the canvas's size to that raster, and the
 * stamp's font pixel stays at least one CSS pixel, as a capture keeps it at
 * least one sheet pixel.
 * Parameter props: The applied inspection, the camera drawn through, the subject's
 * raster and the canvas size shown.
 * Returns: The kept labels, their line height and the number dropped.
 */
export function placeAutoMovieInspectorLabels(props: {
  /*
   * The inspection applied to the picture.
   */
  inspection: IAutoMovieRenderInspectionHandle;

  /*
   * The camera the picture was drawn through.
   */
  camera: THREE.Camera;

  /*
   * The subject's raster in pixels.
   */
  raster: { width: number; height: number };

  /*
   * The canvas as laid out.
   */
  shown: IAutoMovieViewerInspectorSceneHost.ISize;
}): IAutoMovieViewerInspectorScene.ILabels {
  const { width, height } = props.raster;
  const { shown } = props;
  const scale: number = Math.max(1, Math.ceil(height / shown.height));
  const placed: ReturnType<IAutoMovieRenderInspectionHandle["labels"]> =
    props.inspection.labels(props.camera, width, height, scale);
  return {
    labels: placed.labels.map(
      (
        label: IAutoMovieInspectionLabel,
      ): IAutoMovieViewerInspectorScene.ILabels["labels"][number] => ({
        path: label.path,
        text: label.text,
        left: (label.x * shown.width) / width,
        top: (label.y * shown.height) / height,
      }),
    ),
    // The stamp's box is nine font pixels high.
    lineHeight: (9 * scale * shown.height) / height,
    dropped: placed.dropped.length,
  };
}
