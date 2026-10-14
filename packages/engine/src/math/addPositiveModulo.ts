import { positiveModulo } from "./positiveModulo";

/**
 * Add an offset on a positive cyclic domain without perturbing an ordinary phase when the offset is zero or a whole period.
 *
 * Normalizing both operands before their sum prevents a neutral elapsed/start offset from enlarging an already-normalized phase and introducing another wrapping error.
 *
 * Finite operands and a finite positive period are caller premises. An overflowing sum of normalized operands is reduced by subtracting the remaining period instead; ordinary representable sums retain their existing expression order. Results retain binary64 rounding.
 *
 * @evidence contracts/common.md#principled-implementation Normalizes both operands with positiveModulo before adding, preserving neutral whole-period offsets. If their finite nonnegative sum overflows, left-(period-right) computes its wrapped equivalent without the unrepresentable sum, since overflow implies the two normalized operands exceed one finite period.
 * @evidence contracts/common.md#clear-and-simple-design Owns cyclic addition for gait sampling, arranged clip metadata and beat handoff; positiveModulo owns normalization and callers own domain admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The alternate arithmetic follows representability only and preserves the ordinary finite-sum expression; no named gait, duration threshold or fixture changes the phase rule.
 * @evidence contracts/common.md#meaningful-documentation States seconds or other caller-defined cyclic units, finite positive period premise, neutral-offset behavior, overflowing-sum handling and rounded output.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Two operand normalizations, one sum and one final normalization take fixed scalar work and constant space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reuses the two normalized operands for the overflow decision and result; no mutable gait or clock verdict is cached across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one scalar without retaining operands, allocating records or acquiring resources.
 */
export const addPositiveModulo: (value: number, offset: number, period: number) => number = (
  value: number,
  offset: number,
  period: number,
): number => {
  const left: number = positiveModulo(value, period);
  const right: number = positiveModulo(offset, period);
  const sum: number = left + right;
  return positiveModulo(
    !Number.isFinite(sum) && Number.isFinite(left) && Number.isFinite(right)
      ? left - (period - right)
      : sum,
    period,
  );
};
