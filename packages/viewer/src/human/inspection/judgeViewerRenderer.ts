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
 * This reported-string policy cannot prove model display or functioning
 * controls; the caller must observe the actual hardware consumer separately.
 *
 * @evidence contracts/common.md#principled-implementation Refuses blank and named software rasterizers from the reported device string, while leaving actual display and control verification to observation.
 * @evidence contracts/common.md#clear-and-simple-design One renderer-string admission rule serves viewer startup and capture publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the supplied unmasked device description without a fixture-specific hardware exemption or treating HTTP readiness as a rendered frame.
 * @evidence contracts/common.md#meaningful-documentation Lists recognized software devices and states the reported-string policy's limits for visual acceptance.
 *
 * @param renderer The unmasked renderer string the page reports.
 * @returns `real` and, when it is not, the reason to print.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-runtime-identity Classifies the reported renderer string and refuses blank or recognized software device descriptions before capture publication.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-capture-runtime-identity This device-string predicate contributes runtime observation but does not prove model display, controls or complete runtime identity on its own.
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
