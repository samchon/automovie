import type { AuthoredPass } from "../../AuthoredPass";
import { PACKAGE_DOCS_ROOT } from "./PACKAGE_DOCS_ROOT";

/**
 * Names the docs subtree one pass writes into.
 *
 * Construction reads the current manuscript. Naturalness is written, evidenced,
 * and reviewed in its working tree before comment-free promotion to body.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The draft edition addresses the current body tree and the final edition addresses the naturalness working tree; frozen revision references are deliberately handled by referenceLocation instead.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One two-way pass-root rule is shared by authored claim factories, while upstream/frozen reference addressing stays with the relation owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The final-to-naturalness mapping is the declared review-before-promotion lifecycle and does not redirect a consumer to fabricated final output.
 * @evidence contracts/development/common.md#meaningful-documentation The prose explains current manuscript ownership and that naturalness is authored, evidenced and reviewed before comment-free promotion.
 * @evidence contracts/development/implementation.md#efficient-algorithms One branch and string interpolation allocate a fixed-size relative path, independent of file population or document size.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work PACKAGE_DOCS_ROOT shares the directory spelling across callers; this pure fixed mapping has no effectful work or cross-request result cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned path is caller-owned and constant-sized; there are no open handles, retained tasks or growing module collections.
 */
export function passRoot(pass: AuthoredPass): string {
  return `${PACKAGE_DOCS_ROOT}/${pass === "final" ? "naturalness" : "body"}`;
}
