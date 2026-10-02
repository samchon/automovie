import { TestValidator } from "@nestia/e2e";

import { assertBodyPoseCensusIdentity } from "../../../scripts/body-basis/assertBodyPoseCensusIdentity";
import type { IBodyPoseCensusIdentity } from "../../../scripts/body-basis/IBodyPoseCensusIdentity";
import { throwsError } from "../internal/predicates";

/**
 * A census cannot assign rows measured under changing inputs to one revision.
 *
 * Scenarios:
 * 1. Equal independently owned identities pass without mutating either input.
 * 2. A renamed basis or changed same-named payload refuses before publication.
 * 3. A changed repository head or numerical source refuses with its own cause.
 */
export const test_human_body_census_identity = (): void => {
  const initial: IBodyPoseCensusIdentity = {
    basis: { id: "basis/1", sha256: "payload-A" },
    head: "revision-A",
    sourceSha256: "source-A",
  };
  const current = structuredClone(initial);
  const before = structuredClone({ initial, current });
  assertBodyPoseCensusIdentity(initial, current);
  TestValidator.equals("input identities stay owned", { initial, current }, before);
  for (const basis of [
    { ...current.basis, id: "basis/2" },
    { ...current.basis, sha256: "payload-B" },
  ])
    TestValidator.predicate(
      "a changed basis refuses",
      throwsError(() => assertBodyPoseCensusIdentity(initial, { ...current, basis }), "input basis changed"),
    );
  TestValidator.predicate(
    "a changed head refuses",
    throwsError(() => assertBodyPoseCensusIdentity(initial, { ...current, head: "revision-B" }), "head changed"),
  );
  TestValidator.predicate(
    "changed numerical source refuses",
    throwsError(() => assertBodyPoseCensusIdentity(initial, { ...current, sourceSha256: "source-B" }), "source changed"),
  );
};
