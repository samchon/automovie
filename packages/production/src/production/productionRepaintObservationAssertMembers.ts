import { IAutoMovieRepaintObservationMember } from "@automovie/interface";
import { productionRepaintObservationIsExactText } from "./productionRepaintObservationIsExactText";
import { productionRepaintObservationIsDigest } from "./productionRepaintObservationIsDigest";

/**
 * Admit a nonempty ordered member population with unique exact occurrence IDs and selected-lane identities. Repeated shots remain supported. Digest syntax does not verify selected bytes or receipts, and exact-key schema ownership remains outside this typed field validator.
 *
 * @evidence contracts/common.md#principled-implementation One occurrence Set rejects duplicate uses while deterministic source digest or repaint request/attempt/output/receipt/selection fields follow the explicit supported lane branch.
 * @evidence contracts/common.md#clear-and-simple-design Member coherence is shared by digesting and observation admission without embedding current project readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty/duplicate/foreign-lane populations refuse without fallback; metadata digests are neither resident artifact verification nor independent review.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes unique occurrence from repeated shot, selected branch fields and external schema/residency limits.
 * @evidence contracts/performance.md#efficient-algorithms One N-member pass scans selected identity text with expected constant Set operations and O(N) occurrence storage; no sorting or media scan runs.
 * @evidence contracts/performance.md#reuse-equivalent-work Each occurrence enters one shared Set for this admission; changed supplied members are independently checked without cached prior validity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary occurrence Set expires at return/throw and no supplied records, media bytes or project handles are retained.
 */
export const productionRepaintObservationAssertMembers: (members: readonly IAutoMovieRepaintObservationMember[]) => void = (
  members: readonly IAutoMovieRepaintObservationMember[],
): void => {
  if (members.length === 0)
    throw new Error("Repaint sequence observation requires a film member.");
  const occurrences: Set<string> = new Set<string>();
  for (const member of members) {
    if (
      !productionRepaintObservationIsExactText(member.occurrence) ||
      !productionRepaintObservationIsExactText(member.shot) ||
      occurrences.has(member.occurrence) ||
      (member.lane !== "deterministic" && member.lane !== "repainted") ||
      (member.lane === "deterministic"
        ? !productionRepaintObservationIsDigest(member.sourceDigest)
        : !productionRepaintObservationIsExactText(member.requestId) ||
          !productionRepaintObservationIsExactText(member.attemptId) ||
          !productionRepaintObservationIsDigest(member.outputDigest) ||
          !productionRepaintObservationIsDigest(member.candidateReceiptDigest) ||
          !productionRepaintObservationIsExactText(member.selectionId) ||
          !productionRepaintObservationIsDigest(member.selectionDigest))
    )
      throw new Error("Repaint sequence observation member is malformed.");
    occurrences.add(member.occurrence);
  }
};
