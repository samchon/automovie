import { SUBSURFACE_TARGET, subsurfacePhysicalChunk } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Shader compatibility is a pure supplied-chunk boundary. An absent physical
 * diffuse operation refuses the patch before any partial response is emitted.
 *
 * Scenarios:
 *
 * 1. The supported diffuse operation becomes a lookup while surrounding
 *    specular and indirect operations remain byte-for-byte intact.
 * 2. Empty and incompatible chunks fail with the owning compatibility error;
 *    the adjacent supported input succeeds without altering an SDK registry.
 */
export const test_viewer_subsurface_chunk_boundary = (): void => {
  const before = "reflectedLight.directSpecular += specular;\n";
  const after = "\nreflectedLight.indirectDiffuse += indirect;";
  const patched = subsurfacePhysicalChunk(before + SUBSURFACE_TARGET + after);
  TestValidator.predicate("physical diffuse becomes the lookup", !patched.includes(SUBSURFACE_TARGET) &&
    patched.includes("subsurfaceDiffuse( dot( geometryNormal, directLight.direction ) )"));
  TestValidator.predicate("other response operations are preserved", patched.includes(before) && patched.endsWith(after));
  TestValidator.predicate("table reads have independent primary coordinates", ["s.r", "s.g", "s.b"].every((channel) => patched.includes(`vec2( u, ${channel} )`)));
  for (const input of ["", before + after])
    TestValidator.predicate("incompatible chunk refuses before splice", throwsError(() => subsurfacePhysicalChunk(input), "physical lighting chunk"));
};
