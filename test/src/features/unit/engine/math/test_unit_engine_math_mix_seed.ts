import { mixSeed } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `mixSeed` folds a safe-integer seed and a salt into a 32-bit state.
 *
 * Scenarios:
 *
 * 1. The same seed and salt give the same state, 2856422185 for (12345, 7) by the
 *    stated xorshift-multiply steps.
 * 2. A different salt, a different seed, and a seed 2^32 apart each give a
 *    different state, since both words of the seed take part.
 */
export function test_unit_engine_math_mix_seed(): void {
  const base: number = mixSeed(12345, 7);
  TestValidator.equals("pure", mixSeed(12345, 7), base);
  TestValidator.equals("value", base, 2856422185);
  TestValidator.predicate("salt", mixSeed(12345, 8) !== base);
  TestValidator.predicate("seed", mixSeed(12346, 7) !== base);
  TestValidator.predicate("high word", mixSeed(12345 + 2 ** 32, 7) !== base);
}
