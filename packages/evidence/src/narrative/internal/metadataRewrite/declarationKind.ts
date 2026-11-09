import { ACKNOWLEDGEMENT } from "./ACKNOWLEDGEMENT";
import type { EvidenceDeclarationKind } from "./EvidenceDeclarationKind";
import { REVIEW } from "./REVIEW";

/**
 * Classifies one exact structural evidence declaration.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Recognize exact flat grammar only when no HTML delimiter occurs in the line.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One classifier serves recognition and ownership selection.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Delimiter rejection protects structural boundaries for every caller.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states exact classification; undefined represents unsupported syntax.
 * @evidence contracts/development/implementation.md#efficient-algorithms Delimiter searches and at most two regex checks scale with line length.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared non-global grammar expressions are reused; lines are independently classified.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only temporary match work is owned; no input lines are retained.
 */
export function declarationKind(
  line: string,
): EvidenceDeclarationKind | undefined {
  if (
    !line.includes("<!--") &&
    !line.includes("-->") &&
    ACKNOWLEDGEMENT.test(line)
  )
    return "acknowledgement";
  if (!line.includes("<!--") && !line.includes("-->") && REVIEW.test(line))
    return "review";
  return undefined;
}
