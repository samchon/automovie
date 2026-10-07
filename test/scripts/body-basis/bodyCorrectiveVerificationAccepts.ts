import type { IBodyCorrectiveVerification } from "./IBodyCorrectiveVerification";

/**
 * Accept only a clear measured endpoint and every requested clear checkpoint.
 * A skipped midpoint/lighter check is allowed only as explicitly not-sampled;
 * any refusal or crossing rejects the candidate. The actual session calls this
 * before publishing a row, separately from numerical residual/geometry quality.
 *
 * @evidence contracts/common.md#principled-implementation Actual endpoint evidence is mandatory and every requested sample must be measured clear, not refused.
 * @evidence contracts/common.md#clear-and-simple-design One endpoint gate and one shared checkpoint predicate own the acceptance rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No exception or optional check is converted to a fabricated empty crossing count.
 * @evidence contracts/common.md#meaningful-documentation States actual consumer and the independent numerical/quality obligations.
 */
export function bodyCorrectiveVerificationAccepts(input: {
  full: IBodyCorrectiveVerification;
  midpoint: IBodyCorrectiveVerification;
  lighter: IBodyCorrectiveVerification;
}): boolean {
  const clear = (sample: IBodyCorrectiveVerification): boolean =>
    sample.kind === "not-sampled" ||
    (sample.kind === "measured" && sample.pairs.length === 0);
  return (
    input.full.kind === "measured" &&
    input.full.pairs.length === 0 &&
    clear(input.midpoint) &&
    clear(input.lighter)
  );
}
