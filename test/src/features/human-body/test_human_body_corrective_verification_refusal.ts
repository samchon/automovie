import { TestValidator } from "@nestia/e2e";

import { bodyCorrectiveVerificationAccepts } from "../../../scripts/body-basis/bodyCorrectiveVerificationAccepts";
import { readBodyCorrectiveVerification } from "../../../scripts/body-basis/readBodyCorrectiveVerification";
import type { IBodyContactPair } from "../../../scripts/body-basis/readBodyContacts";

/**
 * The real verification owners never count a refused midpoint as clear geometry.
 *
 * Scenarios:
 * 1. A measured empty endpoint plus skipped or measured-clear checks accepts.
 * 2. Any refused full/mid/lighter sample rejects and preserves its cause.
 * 3. Any requested crossing rejects; no endpoint evidence also rejects.
 * 4. Measured pair arrays are independently owned; Error cause text remains exact.
 */
export const test_human_body_corrective_verification_refusal = (): void => {
  const clear = readBodyCorrectiveVerification(() => []);
  const skipped = readBodyCorrectiveVerification(undefined);
  const refused = readBodyCorrectiveVerification(() => { throw new Error("midpoint range refusal"); });
  const pairs: IBodyContactPair[] = [{ part: "hips", other: "leftUpperLeg", triangles: 1, otherTriangles: 2 }];
  const crossed = readBodyCorrectiveVerification(() => pairs);
  TestValidator.predicate("a measured endpoint with optional checks accepts", bodyCorrectiveVerificationAccepts({ full: clear, midpoint: skipped, lighter: clear }));
  TestValidator.equals("refusal preserves the actual cause", refused, { kind: "refused", reason: "midpoint range refusal" });
  for (const trial of [
    { full: refused, midpoint: clear, lighter: clear },
    { full: clear, midpoint: refused, lighter: clear },
    { full: clear, midpoint: clear, lighter: refused },
    { full: crossed, midpoint: clear, lighter: clear },
    { full: clear, midpoint: crossed, lighter: clear },
    { full: clear, midpoint: clear, lighter: crossed },
    { full: skipped, midpoint: clear, lighter: clear },
  ]) TestValidator.predicate("refusal/crossing/absent endpoint cannot accept", !bodyCorrectiveVerificationAccepts(trial));
  if (crossed.kind === "measured") crossed.pairs.pop();
  TestValidator.equals("measurement owns the pair array", pairs.length, 1);
};
