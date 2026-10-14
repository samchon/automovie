import type { IValidation } from "typia";
import { readAutoMovieProductionProjectJson } from "./readAutoMovieProductionProjectJson";

/**
 * Reopen one optional project JSON record through its owning schema validator.
 *
 * @evidence contracts/common.md#principled-implementation Maps an absent guarded JSON record to null, otherwise applies the supplied exact schema and returns its admitted data or throws every reported schema expectation under the owning file address.
 * @evidence contracts/common.md#clear-and-simple-design Project manifest, design and screenplay readers choose their validator while the shared JSON reader owns bytes/duplicate-member/physical admission; this adapter owns only schema-result translation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid data never becomes an empty record and no validator failure is filtered by target or expected fixture; a malformed present record differs from absence.
 * @evidence contracts/common.md#meaningful-documentation Defines null versus schema refusal and delegated byte checks; success returns the validator's data object without a separate freeze or clone.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes the guarded JSON read/parser and supplied validator over its tree; on failure, composing V expectation messages visits V errors once with their total message text allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The owning validator runs on each freshly admitted record; prior path or schema success does not prove unchanged bytes or physical generation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed data transfers on success or becomes unreachable after refusal; byte/descriptor lifetime remains with the JSON reader, and this adapter holds no cache or task.
 */
export function readAutoMovieProductionProjectTypedJson<T>(rootReal: string, file: string, validate: (input: unknown) => IValidation<T>): T | null {
  const value: unknown = readAutoMovieProductionProjectJson(rootReal, file);
  if (value === undefined) return null;
  const result: IValidation<T> = validate(value);
  if (result.success) return result.data;
  throw new Error(`Invalid AutoMovie file "${file}": ${result.errors.map((error: IValidation.IError): string => `${error.path} expects ${error.expected}`).join("; ")}. Correct the owning file before continuing.`);
}
