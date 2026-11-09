import { declarationKind } from "./declarationKind";

/**
 * Recognizes one exact acknowledgement or review declaration.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Recognize either family by delegating exact classification to declarationKind.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The boolean adapter keeps recognition under one grammar owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No separate consumer rule broadens classifier acceptance.
 * @evidence contracts/development/common.md#meaningful-documentation The comment identifies acknowledgement-or-review recognition.
 * @evidence contracts/development/implementation.md#efficient-algorithms Delegated delimiter and grammar checks scale with line length; the result is scalar.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The classifier reuses grammar expressions; independent lines need no boolean cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No input or result is stored after return.
 */
export function isDeclaration(line: string): boolean {
  return declarationKind(line) !== undefined;
}
