import type { IAutoMovieInspectionLabel } from "@automovie/interface";
import { AutoMovieRenderPicture, type IAutoMovieRenderInspectionHandle } from "@automovie/render";
import type * as THREE from "three";

import type { IAutoMovieViewerInspectorScene } from "../IAutoMovieViewerInspectorScene";
import type { IAutoMovieViewerInspectorSceneHost } from "../IAutoMovieViewerInspectorSceneHost";

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
export function placeInspectorLabels(props: {
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
  if (!(shown.width > 0 && shown.height > 0))
    return { labels: [], lineHeight: 0, dropped: 0 };
  const scale: number = Math.max(1, Math.ceil(height / shown.height));
  const placed: ReturnType<IAutoMovieRenderInspectionHandle["labels"]> =
    props.inspection.labels(props.camera, width, height, scale);
  return {
    labels: placed.labels.map(
      (
        label: IAutoMovieInspectionLabel,
      ): IAutoMovieViewerInspectorScene.ILabels["labels"][number] => {
        const box = AutoMovieRenderPicture.labelBox(props.raster, label.text, scale, label);
        return {
          path: label.path,
          text: label.text,
          left: (box.left * shown.width) / width,
          top: (box.top * shown.height) / height,
          width: (box.width * shown.width) / width,
        };
      },
    ),
    // The stamp's box is nine font pixels high.
    lineHeight: (Math.min(height, 9 * scale) * shown.height) / height,
    dropped: placed.dropped.length,
    droppedPaths: placed.dropped.map(({ path }) => path),
  };
}
