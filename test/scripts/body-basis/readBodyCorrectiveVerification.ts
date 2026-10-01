import { bodyPoseCensusRefusalMessage } from "./bodyPoseCensusRefusalMessage";
import type { IBodyCorrectiveVerification } from "./IBodyCorrectiveVerification";
import type { IBodyContactPair } from "./readBodyContacts";

/**
 * Keep actual measurements, explicit refusals and unrequested samples distinct.
 * The corrective session calls this for full/midpoint/lighter checks. Its result
 * owns the pair array and shares read-only entries. A callback failure retains
 * its reason and supplies no fabricated zero-crossing evidence.
 *
 * @evidence contracts/common.md#principled-implementation Refusal cannot become a measured empty geometry and authorize publication.
 * @evidence contracts/common.md#clear-and-simple-design The three explicit result kinds separate absence, success and callback failure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No range or build error is swallowed as a clean sample.
 * @evidence contracts/common.md#meaningful-documentation Identifies actual consumer, callback/ownership and rejection effects.
 */
export function readBodyCorrectiveVerification(sample: () => IBodyContactPair[]): Exclude<IBodyCorrectiveVerification, { kind: "not-sampled" }>;
export function readBodyCorrectiveVerification(sample: undefined): Extract<IBodyCorrectiveVerification, { kind: "not-sampled" }>;
export function readBodyCorrectiveVerification(sample: (() => IBodyContactPair[]) | undefined): IBodyCorrectiveVerification;
export function readBodyCorrectiveVerification(
  sample: (() => IBodyContactPair[]) | undefined,
): IBodyCorrectiveVerification {
  if (sample === undefined) return { kind: "not-sampled" };
  try {
    return { kind: "measured", pairs: sample().slice() };
  } catch (error: unknown) {
    return { kind: "refused", reason: bodyPoseCensusRefusalMessage(error) };
  }
}
