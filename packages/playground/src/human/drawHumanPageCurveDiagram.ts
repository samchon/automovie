import { AutoMovieHumanBodyLaw } from "../../../human/src/generation/AutoMovieHumanBodyLaw";
import type { IAutoMovieHumanBodyCalibration } from "../../../human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import { admitHumanParameters } from "./admitHumanParameters";
import { drawHumanCurveDiagram } from "./drawHumanCurveDiagram";
import { readHumanModulePreview } from "./readHumanModulePreview";

/**
 * Draw the alias's calibration curves as SVG or its 1200 px PNG raster.
 * The registered alias's typed parameters select its calibration through the generator's shape law and supply the legend's stature scale, so a diagram shows the curves that alias's skin is lofted from; it does not generate a model or certify the law. A named module-fit preview's merged calibration is drawn instead of the law's.
 *
 * @param alias Registered typed example whose calibration and scale are drawn.
 * @param curves Diagnostic curve selection, including station-series grammar.
 * @param format SVG text or a PNG data URL from the same SVG.
 * @param modules Module-fit preview to draw, or null for the alias's calibration.
 * @returns The encoded diagram; invalid aliases, previews, curves and failed image decoding reject.
 *
 * @evidence contracts/common.md#principled-implementation Maps the admitted typed parameters through AutoMovieHumanBodyLaw.calibrate, or reads the named preview by readHumanModulePreview, evaluates drawHumanCurveDiagram on that calibration and rasterizes that SVG with a temporary canvas when PNG is requested.
 * @evidence contracts/common.md#clear-and-simple-design Owns only diagram encoding, extracted from the page mount; the shape law, curve evaluator and HTTP publication keep their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the same law output the generator lofts for that alias; no alias-specific shape, source mesh or alternate viewer is introduced.
 * @evidence contracts/common.md#meaningful-documentation States that the alias selects both calibration and scale, the output formats and decoding failures.
 * @evidence contracts/performance.md#efficient-algorithms Evaluates the law's coefficient map once and only the requested curves, with one SVG image decode and one canvas encode for PNG; no skin generation or GPU capture occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work SVG and PNG share the exact evaluator output; the specimen's own parameters reuse the imported calibration object without copying.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary image, canvas, calibration copy and SVG data are local to the call; no listener, scene resource or persistent cache is retained.
 */
export async function drawHumanPageCurveDiagram(
  alias: string,
  curves: string,
  format: "svg" | "png",
  modules: string | null,
): Promise<string> {
  const parameters: IAutoMovieHumanParameters = admitHumanParameters({
    alias,
  }).parameters;
  const height: number | null = parameters.body.controls.height.value;
  const calibration: IAutoMovieHumanBodyCalibration =
    modules === null
      ? AutoMovieHumanBodyLaw.calibrate(parameters).body
      : (await readHumanModulePreview(modules)).calibration;
  const svg: string = drawHumanCurveDiagram(
    calibration,
    curves,
    (height ?? Number.NaN) / calibration.stature,
  );
  if (format === "svg") return svg;
  const image: HTMLImageElement = new Image();
  image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await image.decode();
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
  if (context === null)
    throw new Error("Human curve diagram has no 2D canvas context");
  context.drawImage(image, 0, 0);
  return canvas.toDataURL("image/png");
}
