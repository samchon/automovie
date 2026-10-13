import { ReferenceError } from "./ReferenceError";


/** Stop one reference operation with its intentional sanitized refusal.
 *
 * @evidence contracts/common.md#principled-implementation An intentional refusal throws the reader-owned error class with one stable category and sanitized authored message.
 * @evidence contracts/common.md#clear-and-simple-design One throw helper makes intentional policy failures distinguishable from unknown I/O exceptions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts External diagnostics are never used as the helper's message; callers supply fixed recovery text.
 * @evidence contracts/common.md#meaningful-documentation The comment states operation termination and sanitized refusal identity; the never return type exposes control flow.
 * @evidence contracts/performance.md#efficient-algorithms Constructing one error costs its message and stack storage without input-population traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Each refusal creates a fresh error because its stack and operation belong to that call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The thrown error transfers to the catching transport or caller; the helper retains no source data or handle.
 */
export const fail: (code: string, message: string) => never = (code: string, message: string): never => {
  throw new ReferenceError(code, message);
};
