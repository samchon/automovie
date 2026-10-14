import type { IValidation } from "typia";
import type { AutoMovieProductionRenderLedgerRecord } from "./AutoMovieProductionRenderLedgerRecord";
import { AutoMovieProductionRenderLedgerSchemaError } from "./AutoMovieProductionRenderLedgerSchemaError";

/**
 * Return admitted schema data or project ordered errors into the typed ledger refusal.
 *
 * @evidence contracts/common.md#principled-implementation The typia discriminated result returns successful data; failure projects path and expected shape, relying on caller-generated exact validation.
 * @evidence contracts/common.md#clear-and-simple-design Both concrete schemas share refusal projection while retaining separate validation calls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed data never escapes and offending values are omitted; shape admission does not establish ownership or currentness.
 * @evidence contracts/common.md#meaningful-documentation States same-reference success and ordered schema Error, without cloning or fallback parsing.
 * @evidence contracts/performance.md#efficient-algorithms Success projection is constant after validation; failure traverses E errors and constructs all path/expected strings and the Error message.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumes the completed validation once without a repeated schema scan or accepted-data copy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Data transfers to the caller; failure strings transfer to its Error and temporaries expire, with no retained cache, buffer or handle.
 */
export function admitProductionRenderLedgerValidation<T>(record: AutoMovieProductionRenderLedgerRecord, validation: IValidation<T>): T {
  if (validation.success === false)
    throw new AutoMovieProductionRenderLedgerSchemaError(record, validation.errors.map((error: IValidation.IError): string => `${error.path} expects ${error.expected}`));
  return validation.data;
}
