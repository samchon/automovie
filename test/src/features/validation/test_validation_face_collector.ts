import { ViolationCollector, validateFace } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { makeFace } from "../internal/fixtures";

/**
 * Face validation appends to the supplied collector and uses the caller's diagnostic prefix.
 *
 * Scenarios:
 * 1. Mouth width nine under $doc.face follows one seeded finding in the returned collector and retains the authored dotted path.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the compositional validator with a seeded sink and custom path, comparing returned contents, final count and the appended field address, catching discarded findings or a reset prefix.
 * @evidence contracts/testing.md#independent-expectations One seeded row plus one excessive singular mouth trait gives two rows; the expected second address concatenates the literal caller prefix and authored leaf. Reference identity independently checks that the supplied sink itself is returned.
 * @evidence contracts/testing.md#distinguishing-cases Owns supplied-collector/custom-prefix composition with a missing optional lips group; default empty/populated and signed-range outcomes are separate face entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns a local collector and face document and calls actual engine validation without Human geometry, a process or native artifact.
 */
export function test_validation_face_collector(): void {
  const collector: ViolationCollector = new ViolationCollector();
  collector.push("type", "$doc.id", "pre-existing entry", null);

  const returned: ViolationCollector = validateFace({
    face: makeFace({ mouth: { width: 9 } }),
    path: "$doc.face",
    collector,
  });

  TestValidator.predicate("same collector returned", returned === collector);
  TestValidator.equals("accumulates after the seed", collector.items.length, 2);
  TestValidator.equals(
    "caller's path prefix",
    collector.items[1]!.path,
    "$doc.face.mouth.width",
  );
}
