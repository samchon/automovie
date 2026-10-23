import { AutoMovieHumanBodyCalibration } from "../../../human/src/generation/AutoMovieHumanBodyCalibration";
import { admitHumanParameters } from "./admitHumanParameters";
import { drawHumanCurveDiagram } from "./drawHumanCurveDiagram";

/**
 * Draw the page's current calibration curves as SVG or its 1200 px PNG raster.
 * The registered alias supplies only the legend's stature scale. This remains a diagram of the current shared calibration; it does not generate a second model or certify a parameter law.
 *
 * @param alias Registered typed example whose scale the legend reports.
 * @param curves Diagnostic curve selection, including station-series grammar.
 * @param format SVG text or a PNG data URL from the same SVG.
 * @returns The encoded diagram; invalid aliases, curves and failed image decoding reject.
 *
 * @evidence contracts/common.md#principled-implementation Reads the shared calibration and admitted typed stature, evaluates drawHumanCurveDiagram and rasterizes that SVG with a temporary canvas when PNG is requested.
 * @evidence contracts/common.md#clear-and-simple-design Owns only diagram encoding, extracted from the page mount; the curve evaluator and HTTP publication keep their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the same calibration previously consumed by the page; no alias-specific shape, source mesh or alternate viewer is introduced.
 * @evidence contracts/common.md#meaningful-documentation States calibration authority, the alias's limited scale role, output formats and decoding failures.
 * @evidence contracts/performance.md#efficient-algorithms Evaluates only requested curves and performs one SVG image decode and one canvas encode for PNG; no body generation or GPU capture occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work SVG and PNG share the exact evaluator output and existing imported calibration; no second coefficient cache is created.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary image, canvas and SVG data are local to the call; no listener, scene resource or persistent cache is retained.
 */
export async function drawHumanPageCurveDiagram(
  alias: string,
  curves: string,
  format: "svg" | "png",
): Promise<string> {
  const height: number | null = admitHumanParameters({ alias }).parameters.body
    .controls.height.value;
  const svg: string = drawHumanCurveDiagram(
    AutoMovieHumanBodyCalibration,
    curves,
    (height ?? Number.NaN) / AutoMovieHumanBodyCalibration.stature,
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
