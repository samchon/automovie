import { HEADING_ACKNOWLEDGEMENT } from "./HEADING_ACKNOWLEDGEMENT";
import { HEADING_REVIEW } from "./HEADING_REVIEW";
import type { IEvidenceHeading } from "./IEvidenceHeading";

/**
 * Parses supported evidence section headers without borrowing a body target.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Apply heading grammars and derive review fingerprint offsets from matched structural prefixes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The parsed record exposes only family, level, inline reason and optional hash position.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Identical target or reason tokens cannot redirect the structural offset.
 * @evidence contracts/development/common.md#meaningful-documentation The comment identifies supported headers; empty inline reasons remain explicit.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two regex matches scan L characters with O(L) transient captured text.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Precompiled grammars are reused without caching source-coordinate assumptions.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned records and match arrays are call-owned; no source history persists.
 */
export function evidenceHeading(line: string): IEvidenceHeading | undefined {
  const acknowledgement: RegExpExecArray | null =
    HEADING_ACKNOWLEDGEMENT.exec(line);
  if (acknowledgement !== null)
    return {
      level: acknowledgement[1].length,
      kind: "acknowledgement",
      reason: acknowledgement[4] ?? "",
    };
  const review: RegExpExecArray | null = HEADING_REVIEW.exec(line);
  if (review === null) return undefined;
  return {
    level: review[1].length,
    kind: "review",
    reason: review[5] ?? "",
    fingerprintStart: `${review[1]} @${review[2]} ${review[3]} `.length,
  };
}
