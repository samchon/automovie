import { AutoMovieEngineRenderNode } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The render node-name builders prefix an owner id with its kind.
 *
 * Scenarios:
 *
 * 1. Flame and surface graphic join node and child by a slash.
 * 2. Fluid, planting and soft body prefix one id.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the five node name families and the slash-separated modifier for two-part owners.
 * @evidence contracts/development/testing.md#behavioral-verification Calls every exercised RenderNode name builder with literal owner ids and compares the complete strings.
 * @evidence contracts/development/testing.md#independent-expectations The specified kind prefixes, separators and ids give literal outputs such as flame:torch/cue1 and water:lake. Checking each complete string distinguishes the one-owner and two-owner formats.
 */
export function test_engine_render_node_names(): void {
  TestValidator.equals(
    "two-part names",
    [
      AutoMovieEngineRenderNode.autoMovieFlameNodeName("torch", "cue1"),
      AutoMovieEngineRenderNode.autoMovieSurfaceGraphicNodeName("wall", "sign"),
    ],
    ["flame:torch/cue1", "surface-graphic:wall/sign"],
  );
  TestValidator.equals(
    "one-part names",
    [
      AutoMovieEngineRenderNode.autoMovieFluidSurfaceNodeName("lake"),
      AutoMovieEngineRenderNode.autoMoviePlantingNodeName("orchard"),
      AutoMovieEngineRenderNode.autoMovieSoftBodyNodeName("cloth"),
    ],
    ["water:lake", "planting:orchard", "soft:cloth"],
  );
}
