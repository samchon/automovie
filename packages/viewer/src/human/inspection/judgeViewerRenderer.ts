/**
 * Classify page-reported renderer text against known software/missing-context names: SwiftShader, llvmpipe, WARP and Basic Render Driver. Other nonempty names pass the existing policy and are logged by the caller.
 *
 * The page uses debug renderer information when available and otherwise generic gl.RENDERER. Unknown software or generic text can pass; actual hardware, model display and working controls require separate real-consumer observation.
 *
 * @evidence contracts/common.md#principled-implementation Actual reported renderer text is checked against known software/missing-context names and empty text before admitting the configured hardware policy.
 * @evidence contracts/common.md#clear-and-simple-design A single software-name expression and empty-string branch return the refusal reason to the startup owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown software names and a generic renderer fallback may be accepted; neither acceptance nor text alone certifies physical hardware, model display or working controls.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies named software implementations, logged hardware admission and the need for separate actual-consumer observation.
 * @evidence contracts/performance.md#efficient-algorithms One regular-expression scan and trim take linear work in the reported renderer string.
 * @evidence contracts/performance.md#reuse-equivalent-work The policy classifies each observed string; it does not reuse another browser's hardware admission as this session's proof.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No WebGL context, browser or GPU resource is acquired; only the returned boolean and reason remain.
 */
export function judgeViewerRenderer(renderer: string): {
  real: boolean;
  reason: string;
} {
  const software: RegExpExecArray | null =
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
