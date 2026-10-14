import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";
import { generatedOwnershipDiagnosticMessage } from "../../../../packages/production/src/production/generatedOwnershipDiagnosticMessage";

/**
 * A builder-owned digest mismatch names its output, its causes, and its remedy.
 *
 * This diagnostic used to say that "current source and design" derive the
 * expected digest, which is a verdict about the author's own inputs and sends
 * them hunting a source change that may not exist. A derived-result finding
 * states which output is unconfirmed; a mismatch here is caused either by an
 * edit to the builder-owned file or by a move in any compile input, the build
 * protocol included, and the message has to admit both.
 *
 * The two callers differ in what they can promise. A repairing build will
 * rewrite the file, while a read-only lint can only refuse it and direct the
 * author to compile, so one message may not stand for both.
 *
 * Scenarios:
 *
 * 1. Both arms carry the observed and derived digests.
 * 2. Both arms name an edit and an input move as the two possible causes, and
 *    both name the build protocol among the inputs.
 * 3. Neither arm attributes the mismatch to current source and design alone.
 * 4. The repairing arm promises regeneration, the refusing arm directs to the
 *    scaffold compile command, and the two messages differ.
 * 5. An absent file renders its missing digest rather than inventing one.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual diagnostic formatter with repair/refuse and missing-byte observations, checking both digest values, both possible causes, protocol inclusion and mode-specific remedies. This observes product message output rather than grading authored prose.
 * @evidence contracts/testing.md#independent-expectations Explicit actual/expected identities and the writable versus read-only caller contract determine required information; null is absence rather than a fabricated digest. Fragment checks allow unrelated wording changes and do not establish the physical cause of a mismatch.
 * @evidence contracts/testing.md#distinguishing-cases Repairing and refusing modes share attribution while differing in remedy, and the absent-file neighbor retains null. Digest measurement and actual regeneration are owned by ownership inspection/publication tests.
 * @evidence contracts/testing.md#execution-ownership The named synchronous test_production_generated_ownership_message imports the actual formatter and owns its direct product-output string cases, without filesystem reads/writes, a consumer install or a real host.
 */
export function test_production_generated_ownership_message(): void {
  const actual: string = "sha256:aaaa";
  const expected: string = "sha256:bbbb";
  const repair: string = generatedOwnershipDiagnosticMessage({
    actual,
    expected,
    repair: true,
  });
  const refuse: string = generatedOwnershipDiagnosticMessage({
    actual,
    expected,
    repair: false,
  });
  const absent: string = generatedOwnershipDiagnosticMessage({
    actual: null,
    expected,
    repair: false,
  });

  TestValidator.equals(
    "the digest mismatch names both digests, both causes, and its own remedy",
    namedFacts([
      [
        "bothArmsCarryBothDigests",
        (): boolean =>
          [repair, refuse].every(
            (message: string): boolean => message.includes(actual) && message.includes(expected),
          ),
      ],
      [
        "bothArmsNameAnEdit",
        (): boolean => [repair, refuse].every((message: string): boolean => message.includes("edited")),
      ],
      [
        "bothArmsNameAnInputMove",
        (): boolean =>
          [repair, refuse].every((message: string): boolean => message.includes("inputs moved")),
      ],
      [
        "bothArmsNameTheProtocolAsAnInput",
        (): boolean =>
          [repair, refuse].every((message: string): boolean =>
            message.includes("builder protocol"),
          ),
      ],
      [
        "neitherArmBlamesSourceAndDesignAlone",
        (): boolean =>
          [repair, refuse].every(
            (message: string): boolean =>
              message.includes("current source and design derive") === false,
          ),
      ],
      [
        "theRepairingArmPromisesRegeneration",
        (): boolean => repair.includes("will regenerate"),
      ],
      [
        "theRefusingArmDirectsToCompile",
        (): boolean => refuse.includes("scaffold compile command"),
      ],
      ["thetwoRemediesDiffer", (): boolean => repair !== refuse],
      [
        "anAbsentFileRendersItsMissingDigest",
        (): boolean => absent.includes("Generated digest is null"),
      ],
    ]),
    {
      bothArmsCarryBothDigests: true,
      bothArmsNameAnEdit: true,
      bothArmsNameAnInputMove: true,
      bothArmsNameTheProtocolAsAnInput: true,
      neitherArmBlamesSourceAndDesignAlone: true,
      theRepairingArmPromisesRegeneration: true,
      theRefusingArmDirectsToCompile: true,
      thetwoRemediesDiffer: true,
      anAbsentFileRendersItsMissingDigest: true,
    },
  );
}
