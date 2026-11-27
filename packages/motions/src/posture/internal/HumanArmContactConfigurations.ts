/**
 * Read one coordinate vector per arm from their alternatives, in arm order.
 * Each combination is produced only when its caller needs it.
 *
 * @param choices The alternative coordinate vectors for each arm.
 * @param prefix The arms already selected in a recursive step.
 * @returns The configurations formed from the supplied alternatives.
 */
export function* HumanArmContactConfigurations(
  choices: readonly number[][][],
  prefix: readonly number[][] = [],
): Generator<number[][]> {
  if (prefix.length === choices.length) {
    yield [...prefix];
    return;
  }
  for (const arm of choices[prefix.length]!)
    yield* HumanArmContactConfigurations(choices, [...prefix, arm]);
}
