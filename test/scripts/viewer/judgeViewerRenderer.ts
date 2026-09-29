/**
 * Whether a WebGL `RENDERER` string names real graphics hardware.
 *
 * A review frame is only evidence of how the product looks when a GPU drew
 * it. Chromium silently falls back to a software rasterizer when no GPU
 * context is available, and reading such a frame as a GPU frame is the main
 * false result of viewer verification. The software renderers Chromium and
 * the platforms report are SwiftShader, llvmpipe, WARP (Microsoft's software
 * Direct3D device), the "Basic Render Driver", and a missing context. A
 * string that names none of them is taken as hardware; the caller logs the
 * string, so a reader can still see what was accepted.
 *
 * @param renderer The unmasked renderer string the page reports.
 * @returns `real` and, when it is not, the reason to print.
 */
export function judgeViewerRenderer(renderer: string): {
  real: boolean;
  reason: string;
} {
  const software =
    /swiftshader|llvmpipe|softpipe|\bwarp\b|basic render driver|no_webgl/i.exec(
      renderer,
    );
  if (renderer.trim() === "")
    return { real: false, reason: "The page reported no renderer string." };
  if (software !== null)
    return {
      real: false,
      reason: `The renderer "${renderer}" is a software rasterizer (${software[0]}), not a GPU.`,
    };
  return { real: true, reason: "" };
}
