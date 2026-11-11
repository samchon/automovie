import { SUBSURFACE_TARGET, subsurfacePhysicalChunk } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Exercises a pure supported-chunk transformation and its adjacent compatibility refusal.
 *
 * Scenarios:
 * 1. The supported authored diffuse target becomes independent RGB lookup coordinates while surrounding specular/indirect operations remain.
 * 2. Empty and missing-target strings refuse with the compatibility diagnostic.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual chunk patcher on authored surrounding operations and the supported diffuse target, judging returned source and failure diagnostics.
 * @evidence contracts/development/testing.md#independent-expectations Literal independently supplied specular/indirect operations and separate expected lookup channels judge the transformation rather than inspecting maintained source files.
 * @evidence contracts/development/testing.md#distinguishing-cases Supported input contrasts empty/missing-target chunks; unchanged surrounding operations distinguish overbroad replacement from the intended diffuse splice.
 * @evidence contracts/development/testing.md#execution-ownership The named entry owns only strings and uses no shader registry mutation, actual native compiler, material replacement or GPU observation.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The supported authored diffuse target becomes independent RGB lookup coordinates while surrounding specular/indirect operations remain.).
 */
export function test_viewer_subsurface_chunk_boundary(): void {
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
