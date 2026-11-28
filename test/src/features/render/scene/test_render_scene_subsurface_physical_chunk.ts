import { AutoMovieRenderSubsurfaceTarget, AutoMovieRenderSubsurfaceShading } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `subsurfacePhysicalChunk` splices the subsurface lookup over the physical
 * diffuse term.
 *
 * Scenarios:
 *
 * 1. The target text is replaced by the lookup with one table read per RGB
 *    channel, and the text around it is kept.
 * 2. An empty chunk and one without the target are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases describe the physical diffuse anchor, one lookup per RGB channel, and incompatible source chunks.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that replacing the diffuse expression emits the expected table reads, keeps surrounding text, and refuses a missing anchor.
 * @evidence contracts/development/testing.md#independent-expectations Uses explicit surrounding source fragments and channel-specific lookup snippets, together with empty and unrelated shader controls.
 */
export function test_render_scene_subsurface_physical_chunk(): void {
  const before: string = "reflectedLight.directSpecular += specular;\n";
  const after: string = "\nreflectedLight.indirectDiffuse += indirect;";
  const patched: string = AutoMovieRenderSubsurfaceShading.physicalChunk(
    before + AutoMovieRenderSubsurfaceTarget + after,
  );
  TestValidator.predicate(
    "target replaced by the lookup",
    !patched.includes(AutoMovieRenderSubsurfaceTarget) &&
      patched.includes(
        "subsurfaceDiffuse( dot( geometryNormal, directLight.direction ) )",
      ),
  );
  TestValidator.predicate(
    "surroundings kept",
    patched.includes(before) && patched.endsWith(after),
  );
  TestValidator.predicate(
    "one table read per channel",
    ["s.r", "s.g", "s.b"].every((channel: string): boolean =>
      patched.includes(`vec2( u, ${channel} )`),
    ),
  );
  for (const input of ["", before + after])
    TestValidator.error("incompatible chunk", (): void => {
      AutoMovieRenderSubsurfaceShading.physicalChunk(input);
    });
}
