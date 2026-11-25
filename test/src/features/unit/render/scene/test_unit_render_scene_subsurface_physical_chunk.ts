import { SUBSURFACE_TARGET, subsurfacePhysicalChunk } from "@automovie/render";
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
 */
export function test_unit_render_scene_subsurface_physical_chunk(): void {
  const before: string = "reflectedLight.directSpecular += specular;\n";
  const after: string = "\nreflectedLight.indirectDiffuse += indirect;";
  const patched: string = subsurfacePhysicalChunk(
    before + SUBSURFACE_TARGET + after,
  );
  TestValidator.predicate(
    "target replaced by the lookup",
    !patched.includes(SUBSURFACE_TARGET) &&
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
      subsurfacePhysicalChunk(input);
    });
}
