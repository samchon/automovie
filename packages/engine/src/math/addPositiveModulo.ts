import { positiveModulo } from "./positiveModulo";

/**
 * Add an offset on a positive cyclic domain without perturbing an ordinary phase when the offset is zero or a whole period.
 *
 * Normalizing both operands before their sum prevents a neutral elapsed/start offset from enlarging an already-normalized phase and introducing another wrapping error.
 *
 * Finite operands and a finite positive period are caller premises. An overflowing sum of normalized operands is reduced by subtracting the remaining period instead; ordinary representable sums retain their existing expression order. Results retain binary64 rounding.
 */
export const addPositiveModulo: (
  value: number,
  offset: number,
  period: number,
) => number = (value: number, offset: number, period: number): number => {
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
