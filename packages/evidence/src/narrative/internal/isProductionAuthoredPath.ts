import path from "node:path";

import { canonicalProductionPath } from "../canonicalProductionPath";

/**
 * Identifies physical and logical authoring inputs that cannot be global engineering.
 *
 * @evidence contracts/common.md#principled-implementation A segment-bounded pattern checks portable lexical spelling and canonical normalized spelling for known authoring subtrees; actual physical alias resolution remains a capture responsibility.
 * @evidence contracts/common.md#clear-and-simple-design The helper answers authoring-path vocabulary in one place for declared and captured support guards.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The listed body/revision/working/review/evidence/instruction/contract trees are domain boundaries; segment delimiters prevent similarly prefixed ordinary directories being classified as authored.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies engineering exclusion by logical/physical spelling; the implementation does not claim to resolve symlinks itself.
 * @evidence contracts/performance.md#efficient-algorithms Normalization and two boundary-pattern tests scan path characters with linear temporary string storage; the fixed subtree alternatives add no input-sized lookup structure.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar path predicate coordinates no requests or cross-phase cache, and physical capture consumers supply their saved resolutions separately.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only local strings and a regexp are allocated; no per-call state, filesystem handle or running task survives.
 */
export function isProductionAuthoredPath(filename: string): boolean {
  const portable: string = filename.replaceAll("\\", "/");
  const lexical: string = (
    /^[A-Za-z]:\//u.test(portable)
      ? path.win32.normalize(portable)
      : path.resolve(portable)
  ).replaceAll("\\", "/");
  const physical: string = canonicalProductionPath(filename);
  const boundary: RegExp =
    /\/(?:docs\/(?:body|revision|naturalness|review|evidence|instructions)|\.agents\/skills\/contracts\/story)(?:\/|$)/iu;
  return boundary.test(lexical) || boundary.test(physical);
}
