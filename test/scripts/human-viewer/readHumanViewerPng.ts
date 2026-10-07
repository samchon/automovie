import type { IReadHumanViewerPngProps } from "./IReadHumanViewerPngProps";
import { assertHumanViewerFrame } from "./assertHumanViewerFrame";
import { captureHumanViewerReference } from "./captureHumanViewerReference";

/**
 * Finish the frame on screen and read it as a PNG data URL. A WebGL error
 * fails the capture. The photograph is a DOM layer above the canvas, so a
 * comparison is composed into the image.
 *
 * @evidence contracts/common.md#principled-implementation A frame with a GL error is refused, never returned.
 * @evidence contracts/common.md#meaningful-documentation States the error rule and the composition.
 */
export function readHumanViewerPng(props: IReadHumanViewerPngProps): string {
  props.stage.finish();
  const gl = props.renderer.getContext();
  assertHumanViewerFrame(gl.getError(), gl.NO_ERROR);
  if (props.composition === null) return props.canvas.toDataURL("image/png");
  return captureHumanViewerReference({
    composition: props.composition,
    landmarks: props.composition.landmarks,
    photo: props.photo,
    render: props.canvas,
    create: () => document.createElement("canvas"),
  });
}
