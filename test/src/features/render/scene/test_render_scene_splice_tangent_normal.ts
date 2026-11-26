import { DETAIL_NORMAL_TARGET, AutoMovieRenderDetailNormalShading } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `spliceTangentNormal` puts code before the tangent-space normal line.
 *
 * Scenarios:
 *
 * 1. Code is inserted on a line before the target, which stays after it.
 * 2. A shader without the target is refused.
 */
export function test_render_scene_splice_tangent_normal(): void {
  TestValidator.equals(
    "inserted",
    AutoMovieRenderDetailNormalShading.spliceTangentNormal(`head\n${DETAIL_NORMAL_TARGET}\ntail`, "blend();"),
    `head\nblend();\n\t${DETAIL_NORMAL_TARGET}\ntail`,
  );
  TestValidator.error("no target", (): void => {
    AutoMovieRenderDetailNormalShading.spliceTangentNormal("void main() {}", "blend();");
  });
}