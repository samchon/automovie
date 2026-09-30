import { judgeViewerRenderer } from "../../../scripts/viewer/judgeViewerRenderer";
import { TestValidator } from "@nestia/e2e";

/**
 * A frame counts as a GPU frame only when the renderer string is not a
 * software rasterizer, because Chromium falls back to one silently.
 *
 * Scenarios:
 * 1. Real device strings (an ANGLE-wrapped AMD, an NVIDIA and an Apple string)
 *    are accepted with an empty reason.
 * 2. SwiftShader, llvmpipe, softpipe, WARP, the Basic Render Driver and
 *    NO_WEBGL are each refused, and the reason names the string.
 * 3. An empty or blank string is refused: no string is no evidence.
 * 4. Negative twin: a hardware name that merely contains the letters "warp"
 *    inside a longer word is accepted, so the WARP match is a whole word.
 */
export const test_viewer_renderer_judgement = (): void => {
  for (const device of [
    "ANGLE (AMD, AMD Radeon 780M Graphics (0x000015BF) Direct3D11 vs_5_0 ps_5_0, D3D11)",
    "NVIDIA GeForce RTX 4090/PCIe/SSE2",
    "Apple M2 Pro",
  ])
    TestValidator.equals(`real ${device}`, judgeViewerRenderer(device), {
      real: true,
      reason: "",
    });
  for (const soft of [
    "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)",
    "llvmpipe (LLVM 15.0.7, 256 bits)",
    "softpipe",
    "ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11)",
    "Microsoft WARP",
    "NO_WEBGL",
  ]) {
    const verdict = judgeViewerRenderer(soft);
    TestValidator.predicate(
      `software ${soft}`,
      !verdict.real && verdict.reason.includes(soft),
    );
  }
  TestValidator.predicate("empty", !judgeViewerRenderer("").real);
  TestValidator.predicate("blank", !judgeViewerRenderer("   ").real);
  TestValidator.predicate(
    "warp inside a longer word is not WARP",
    judgeViewerRenderer("NVIDIA GeForce Warpaint Edition").real,
  );
};
