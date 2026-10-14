import type { IReadHumanViewerPngProps } from "./IReadHumanViewerPngProps.js";
import { assertHumanViewerFrame } from "./assertHumanViewerFrame.js";
import { captureHumanViewerReference } from "./captureHumanViewerReference.js";

/**
 * Finish the frame on screen and read it as a PNG data URL. A WebGL error fails the capture. The photograph is a DOM layer above the canvas, so a comparison is composed into the image.
 *
 * @evidence contracts/common.md#principled-implementation Reads the finished stage PNG after checking context loss before and after frame completion and checking reported WebGL error after completion.
 * @evidence contracts/common.md#clear-and-simple-design The stage owns drawing while this read boundary owns context availability and returning the canvas's PNG representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A lost context or GPU error refuses instead of returning an image as a successful observed frame; successful pixels are unchanged by the added checks.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes finished frame encoding from numerical admission and explains unavailable-context refusal.
 * @evidence contracts/performance.md#efficient-algorithms Context checks are fixed work; canvas PNG encoding dominates with the displayed pixel count and encoded byte size.
 * @evidence contracts/performance.md#reuse-equivalent-work Every read observes the current finished stage; no prior encoded frame is substituted solely because document or source names match.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The stage and canvas are borrowed; the returned data URL retains this frame's encoded bytes and no new WebGL resource is acquired.
 */
export function readHumanViewerPng(props: IReadHumanViewerPngProps): string {
  const gl: ReturnType<IReadHumanViewerPngProps["renderer"]["getContext"]> = props.renderer.getContext();
  if (gl.isContextLost()) throw new Error("The GPU context is lost before capture.");
  props.stage.finish();
  if (gl.isContextLost()) throw new Error("The GPU context was lost during capture.");
  assertHumanViewerFrame(gl.getError(), gl.NO_ERROR);
  if (props.composition === null) return props.canvas.toDataURL("image/png");
  return captureHumanViewerReference({
    composition: props.composition,
    landmarks: props.composition.landmarks,
    photo: props.photo,
    render: props.canvas,
    create: (): HTMLCanvasElement => document.createElement("canvas"),
  });
}
