import { HEADING_ACKNOWLEDGEMENT } from "./HEADING_ACKNOWLEDGEMENT";
import { HEADING_REVIEW } from "./HEADING_REVIEW";
import type { IEvidenceHeading } from "./IEvidenceHeading";

/** Parses supported evidence section headers without borrowing a body target. */
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
