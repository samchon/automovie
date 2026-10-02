import { TestValidator } from "@nestia/e2e";

import { bodyPoseCensusSourceDigest } from "../../../scripts/body-basis/bodyPoseCensusSourceDigest";
import { throwsError } from "../internal/predicates";

/**
 * A source fingerprint identifies named bytes independently of collection order.
 * This exercises synthetic byte collections and reads no repository source.
 *
 * Scenarios:
 * 1. Reversing two distinct entries preserves the digest and caller ownership.
 * 2. Changing contents, a path or the population changes the fingerprint.
 * 3. Path/content boundaries remain distinct and duplicate paths refuse.
 * 4. Empty input has a deterministic identity.
 */
export const test_human_body_census_source_digest = (): void => {
  const files = [
    { path: "left", bytes: Uint8Array.of(0, 1, 2) },
    { path: "right", bytes: Uint8Array.of(3, 4, 255) },
  ];
  const before = structuredClone(files);
  const digest = bodyPoseCensusSourceDigest(files);
  TestValidator.equals("collection order is irrelevant", bodyPoseCensusSourceDigest([...files].reverse()), digest);
  TestValidator.equals("source bytes stay owned", files, before);
  for (const changed of [
    [{ ...files[0], bytes: Uint8Array.of(0, 1, 3) }, files[1]],
    [{ ...files[0], path: "renamed" }, files[1]],
    [files[0]],
  ])
    TestValidator.predicate("a different input has a different fingerprint", bodyPoseCensusSourceDigest(changed) !== digest);
  TestValidator.predicate(
    "path and content boundaries do not collapse",
    bodyPoseCensusSourceDigest([{ path: "a", bytes: Uint8Array.of(98, 99) }]) !==
      bodyPoseCensusSourceDigest([{ path: "ab", bytes: Uint8Array.of(99) }]),
  );
  TestValidator.predicate(
    "two definitions of one path refuse",
    throwsError(() => bodyPoseCensusSourceDigest([files[0], files[0]]), "distinct file paths"),
  );
  TestValidator.equals("empty identity is stable", bodyPoseCensusSourceDigest([]), bodyPoseCensusSourceDigest([]));
};
