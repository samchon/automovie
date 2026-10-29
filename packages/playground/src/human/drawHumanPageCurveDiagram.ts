import { AutoMovieHumanBodyLaw } from "../../../human/src/generation/AutoMovieHumanBodyLaw";
import type { IAutoMovieHumanBodyCalibration } from "../../../human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import { admitHumanParameters } from "./admitHumanParameters";
import { drawHumanCurveDiagram } from "./drawHumanCurveDiagram";

/**
 * Draw calibration curves from actual loaded parameters, falling back to a registered alias only without a model.
 * This reevaluates the generator's shape law and stature scale; it does not measure the loaded skin mesh or certify the law.
 *
 * @param alias Registered typed example used only when actual parameters are absent.
 * @param curves Diagnostic curve selection, including station-series grammar.
 * @param format SVG text or a PNG data URL from the same SVG.
 * @param parameters Actual parameters of the currently loaded generated result, when available.
 * @returns The encoded diagram; missing parameters and alias, invalid curves and failed image decoding reject.
 *
 * @evidence contracts/common.md#principled-implementation Maps the actual generated parameters, or an admitted alias fallback, through AutoMovieHumanBodyLaw.calibrate and rasterizes the same evaluated SVG when PNG is requested.
 * @evidence contracts/common.md#clear-and-simple-design Owns diagram evaluation and encoding; the loaded parameter reference comes from the page, while the shape law and HTTP publication keep their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A loaded result always supplies its actual parameters; no alias substitution, source mesh or alternate shape is introduced.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes actual parameters from alias fallback and law reevaluation from mesh measurement.
 * @evidence contracts/performance.md#efficient-algorithms Evaluates the coefficient map once and only requested curves, with one image decode and canvas encode for PNG; no skin generation or GPU capture occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work SVG and PNG share the evaluator output; actual generated parameters are passed by reference.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary image, canvas, calibration and SVG data are call-owned; no listener, scene resource or persistent cache is retained.
 */
export async function drawHumanPageCurveDiagram(
  alias: string | null,
  curves: string,
  format: "svg" | "png",
  parameters?: IAutoMovieHumanParameters,
): Promise<string> {
  if (parameters === undefined) {
    if (alias === null) throw new Error("Human curve diagram needs loaded parameters or an alias");
    parameters = admitHumanParameters({ alias }).parameters;
  }
  const height: number | null = parameters.body.controls.height.value;
  const calibration: IAutoMovieHumanBodyCalibration =
    AutoMovieHumanBodyLaw.calibrate(parameters).body;
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
