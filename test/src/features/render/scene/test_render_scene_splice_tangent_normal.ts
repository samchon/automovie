import { AutoMovieRenderDetailNormalTarget, AutoMovieRenderDetailNormalShading } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `spliceTangentNormal` puts code before the tangent-space normal line.
 *
 * Scenarios:
 *
 * 1. Code is inserted on a line before the target, which stays after it.
 * 2. A shader without the target is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases state the tangent-space shader line, the inserted code, and the missing-line control.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that the splice places new code before the target while retaining that line, and refuses an incompatible shader.
 * @evidence contracts/development/testing.md#independent-expectations Compares against a literal result with both lines in order and uses a shader without that anchor for refusal.
 */
export function test_render_scene_splice_tangent_normal(): void {
  TestValidator.equals(
    "inserted",
    AutoMovieRenderDetailNormalShading.spliceTangentNormal(`head\n${AutoMovieRenderDetailNormalTarget}\ntail`, "blend();"),
    `head\nblend();\n\t${AutoMovieRenderDetailNormalTarget}\ntail`,
  );
  TestValidator.error("no target", (): void => {
    AutoMovieRenderDetailNormalShading.spliceTangentNormal("void main() {}", "blend();");
  });
}