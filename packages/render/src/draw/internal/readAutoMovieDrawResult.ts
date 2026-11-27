import type {
  IAutoMovieDrawCall,
  IAutoMovieDrawResult,
  IAutoMovieDrawnMouth,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieInspectionLabel,
  IAutoMovieInspectionLegendEntry,
} from "@automovie/interface";
import type * as THREE from "three";

import { resolveAutoMovieCapturePatterns } from "../../capture/internal/resolveAutoMovieCapturePatterns.js";
import type { IAutoMovieRenderInspectionHandle } from "../../scene/IAutoMovieRenderInspectionHandle.js";
import type { IAutoMovieRenderInspectionPath } from "../../scene/IAutoMovieRenderInspectionPath.js";
import { listAutoMovieInspectionPaths } from "../../scene/inspection/internal/listAutoMovieInspectionPaths.js";
import type { AutoMovieRenderInspectionCamera } from "../../scene/AutoMovieRenderInspectionCamera.js";
import { AutoMovieRenderSemanticMask, AutoMovieRenderSemanticMask } from "../../scene/AutoMovieRenderSemanticMask.js";
import { encodeAutoMovieDrawPixels } from "./encodeAutoMovieDrawPixels.js";

/*
 * Read the drawn picture back and assemble the draw page's result: the pixels
 * read from the renderer's canvas in the same task, flipped to rows from the
 * top and averaged down from the supersampled raster by
 * `encodeAutoMovieDrawPixels`; the inspection's labels at the output raster and
 * call scale; its legend with the witness legend; the diagnostics, the mask
 * pass's palette and the mouths read for the drawn second when there are any;
 * the camera record; and every pattern of the request and view resolved by
 * `resolveAutoMovieCapturePatterns` against the scene's object paths and the
 * selected mark paths, so the record names what each matched.
 */
export function readAutoMovieDrawResult(props: {
  /*
   * The page's renderer, whose canvas holds the picture.
   */
  renderer: THREE.WebGLRenderer;

  /*
   * The draw call.
   */
  call: IAutoMovieDrawCall;

  /*
   * Drawn raster width, the call's times `factor`.
   */
  width: number;

  /*
   * Drawn raster height, the call's times `factor`.
   */
  height: number;

  /*
   * Supersampling side the picture is averaged down by.
   */
  factor: number;

  /*
   * The inspection the picture was drawn under.
   */
  handle: IAutoMovieRenderInspectionHandle;

  /*
   * The witness legend of the picture.
   */
  diagnosticLegend: readonly IAutoMovieInspectionLegendEntry[];

  /*
   * The drawn scene.
   */
  scene: THREE.Scene;

  /*
   * The view resolved at the drawn second.
   */
  resolved: AutoMovieRenderInspectionCamera.IResolveViewResult;

  /*
   * The call's shade.
   */
  shade: IAutoMovieDrawCall["request"]["shade"];

  /*
   * The diagnostics observed at the placement, if any.
   */
  diagnostics: IAutoMovieInspectionDiagnostics | undefined;

  /*
   * The mouths read for the drawn second, if the subject speaks.
   */
  mouths: IAutoMovieDrawnMouth[] | undefined;
}): IAutoMovieDrawResult {
  const { call, width, height, handle }: typeof props = props;
  const context: WebGLRenderingContext | WebGL2RenderingContext =
    props.renderer.getContext();
  const bytes: Uint8Array = new Uint8Array(width * height * 4);
  context.readPixels(
    0,
    0,
    width,
    height,
    context.RGBA,
    context.UNSIGNED_BYTE,
    bytes,
  );
  const labels: IAutoMovieInspectionLabel[] = handle.labels(
    props.resolved.camera,
    call.width,
    call.height,
    call.scale,
  ).labels;
  return {
    pixels: encodeAutoMovieDrawPixels(bytes, width, height, props.factor),
    width: call.width,
    height: call.height,
    labels: labels.map(
      (
        label: IAutoMovieInspectionLabel,
      ): IAutoMovieDrawResult["labels"][number] => ({
        text: label.text,
        x: label.x,
        y: label.y,
      }),
    ),
    legend: [
      ...handle.legend.map(
        (
          entry: IAutoMovieInspectionLegendEntry,
        ): IAutoMovieInspectionLegendEntry => ({ ...entry }),
      ),
      ...props.diagnosticLegend,
    ],
    ...(props.diagnostics === undefined
      ? {}
      : { diagnostics: props.diagnostics }),

    // The mask pass chose its palette from the scene's attachment, which the
    // host cannot see, so the page reports what it painted with.
    ...(props.shade === "mask"
      ? { semanticMask: AutoMovieRenderSemanticMask.of(props.scene)?.mask ?? null }
      : {}),
    ...(props.mouths === undefined ? {} : { mouths: props.mouths }),
    camera: props.resolved.record,
    resolved: resolveAutoMovieCapturePatterns({
      paths: [
        ...listAutoMovieInspectionPaths(props.scene).map(
          (entry: IAutoMovieRenderInspectionPath): string => entry.path,
        ),
        ...handle.selected,
      ],
      request: call.request,
      view: call.view,
    }),
  };
}
