import { TestValidator } from "@nestia/e2e";

import { externalModelValidationFacts1 } from "../internal/ingestMatrix/externalModelValidationFacts1";
import { externalModelValidationFacts2 } from "../internal/ingestMatrix/externalModelValidationFacts2";
import { externalModelValidationFacts3 } from "../internal/ingestMatrix/externalModelValidationFacts3";
import { namedFacts } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Every named fact runs the public byte inspector and requires successful admission, a specific returned mapping, or a field-specific refusal; the FLOAT case catches negative influence cancellation. Acceptance-only facts establish that the declared input is admitted, without claiming its full returned inventory or rendered result.
 * @evidence contracts/testing.md#independent-expectations Field/value expectations derive from glTF/GLB storage and profile contracts; the weight vector has an independently chosen negative component with an exactly positive sum. RFC 4648 section 3.5 defines zero unused bits: AQ==/AQI= are canonical, while AR==/AQJ= decode to the same bytes with nonzero unused bits. Sparse/matrix cases check structural byte admission rather than decoded geometry, and one-byte image payloads check presence rather than media validity.
 * @evidence contracts/testing.md#distinguishing-cases Existing structural, payload, sparse, matrix and VRM twins preserve positive/negative/boundary cases, including valid FLOAT weights and zero components adjacent to the new negative influence; canonical base64 positive controls accompany both malformed padding-bit twins.
 * @evidence contracts/testing.md#execution-ownership The discoverable test function runs synchronous portable inspector semantics with resident synthetic bytes; internal fact factories preserve all dynamically registered cases without processes or GPU.
 */
export function test_ingest_external_model_validation_matrix(): void {
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
