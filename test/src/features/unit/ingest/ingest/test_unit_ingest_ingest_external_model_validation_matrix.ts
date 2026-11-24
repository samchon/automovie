import { TestValidator } from "@nestia/e2e";

import { externalModelValidationFacts1 } from "../../../internal/ingestMatrix/externalModelValidationFacts1";
import { externalModelValidationFacts2 } from "../../../internal/ingestMatrix/externalModelValidationFacts2";
import { externalModelValidationFacts3 } from "../../../internal/ingestMatrix/externalModelValidationFacts3";
import { namedFacts } from "../../../internal/predicates";
import { test12ValuesClose } from "../../../internal/test12ValuesClose";

/**
 * Pin external-model structural, payload and humanoid boundaries without host processes.
 *
 * Scenarios:
 *
 * 1. Structural and accessor field twins retain their original valid and malformed distinctions.
 * 2. Resident URI/GLB payload and sparse/matrix boundaries retain their original byte-derived expectations.
 * 3. Humanoid/VRM mappings retain their original valid, malformed and version-migration cases.
 * 4. A negative FLOAT skin influence is refused even when a positive influence makes their sum exactly one.
 * 5. Base64 image payload twins differ only in unused terminal bits for one and two padding characters.
 */
export function test_unit_ingest_ingest_external_model_validation_matrix(): void {
  const facts: [string, () => boolean][] = [
    ...externalModelValidationFacts1(),
    ...externalModelValidationFacts2(),
    ...externalModelValidationFacts3(),
  ];
  TestValidator.predicate(
    "external model validation facts",
    test12ValuesClose(
      namedFacts(facts),
      Object.fromEntries(
        facts.map(([name]: [string, () => boolean]): [string, boolean] => [
          name,
          true,
        ]),
      ),
    ),
  );
}
