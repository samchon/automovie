import { positiveModulo } from "./positiveModulo";

/**
 * Add an offset on a positive cyclic domain without perturbing the phase when
 * the offset is zero or a whole period.
 *
 * Normalizing both operands before their sum prevents a neutral elapsed/start
 * offset from first enlarging an already normalized phase and then rounding it
 * differently while wrapping the combined value.
 *
 * @internal
 */
export const addPositiveModulo = (
  value: number,
  offset: number,
  period: number,
): number =>
  positiveModulo(
    positiveModulo(value, period) + positiveModulo(offset, period),
    period,
  );
