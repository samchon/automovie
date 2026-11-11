import type { IAutoMovieDrawCall, IAutoMovieDrawResult } from "@automovie/render";

/**
 * What a recording draw page answers for a call: a picture at the call's raster, rows from the top, each pixel `[row, column, 7, 255]` so a flipped or shifted picture is told apart, with one label, a legend of one blue kind and a perspective camera named by the call's view.
 */
export function answerDrawCall(call: IAutoMovieDrawCall): IAutoMovieDrawResult {
  let text: string = "";
  for (let row: number = 0; row < call.height; row++)
    for (let column: number = 0; column < call.width; column++)
      text += String.fromCharCode(row, column, 7, 255);
  return {
    pixels: btoa(text),
    width: call.width,
    height: call.height,
    labels: [{ text: "hero", x: 1, y: 2 }],
    legend: [{ label: "trail", color: 0x3070c0, count: 2 }],
    camera: {
      view: call.view,
      projection: "perspective",
      position: { x: 0, y: 1, z: 4 },
      target: { x: 0, y: 1, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fovDeg: 40,
      metresPerPixel: null,
      near: 0.1,
      far: 100,
    },
  };
}
