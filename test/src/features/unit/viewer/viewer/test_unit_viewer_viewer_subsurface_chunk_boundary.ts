import { SUBSURFACE_TARGET, subsurfacePhysicalChunk } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * Exercises a pure supported-chunk transformation and its adjacent compatibility refusal.
 *
 * Scenarios:
 * 1. The supported authored diffuse target becomes independent RGB lookup coordinates while surrounding specular/indirect operations remain.
 * 2. Empty and missing-target strings refuse with the compatibility diagnostic.
 */
export function test_unit_viewer_viewer_subsurface_chunk_boundary(): void {
  const before: string = "reflectedLight.directSpecular += specular;\n";
  const after: string = "\nreflectedLight.indirectDiffuse += indirect;";
  const patched: string = subsurfacePhysicalChunk(
    before + SUBSURFACE_TARGET + after,
  );
  TestValidator.predicate(
    "physical diffuse becomes the lookup",
    !patched.includes(SUBSURFACE_TARGET) &&
      patched.includes(
        "subsurfaceDiffuse( dot( geometryNormal, directLight.direction ) )",
      ),
  );
  TestValidator.predicate(
    "other response operations are preserved",
    patched.includes(before) && patched.endsWith(after),
  );
  TestValidator.predicate(
    "table reads have independent primary coordinates",
    ["s.r", "s.g", "s.b"].every((channel: string): boolean =>
      patched.includes(`vec2( u, ${channel} )`),
    ),
  );
  for (const input of ["", before + after])
    TestValidator.predicate(
      "incompatible chunk refuses before splice",
      throwsError(
        (): string => subsurfacePhysicalChunk(input),
        "physical lighting chunk",
      ),
    );
}
