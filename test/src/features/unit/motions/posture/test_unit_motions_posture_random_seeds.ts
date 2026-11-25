import { HumanRandomSeeds } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The C++ standard's `ranlux24_base`,
 * `subtract_with_carry_engine<uint_fast32_t, 24, 10, 24>`, written from the
 * standard's definition ([rand.eng.sub]): seeded by
 * `linear_congruential_engine<uint_fast32_t, 40014, 0, 2147483563>` from the
 * seed, the default seed 19780503 for a seed of zero, each word that engine's
 * output modulo 2^24, the carry set when the last word is zero; each draw `Y =
 * x(i − 10) − x(i − 24) − c`, the carry `Y < 0`, the word `Y mod 2^24`.
 */
function reference(seed: number): () => number {
  const m: number = 2147483563;
  let x: number = (seed === 0 ? 19780503 : seed) % m;
  if (x === 0) x = 1;
  const words: number[] = [];
  for (let i: number = 0; i < 24; ++i) {
    x = (40014 * x) % m;
    words.push(x % 16777216);
  }
  let carry: number = words[23] === 0 ? 1 : 0;
  let i: number = 0;
  return (): number => {
    const y: number = words[(i + 14) % 24]! - words[i]! - carry;
    carry = y < 0 ? 1 : 0;
    words[i] = ((y % 16777216) + 16777216) % 16777216;
    const out: number = words[i]!;
    i = (i + 1) % 24;
    return out;
  };
}

/**
 * Libc++'s `uniform_int_distribution<int>(1, 1000000000)` over `ranlux24_base`:
 * the range needs 30 bits, drawn as two 15-bit halves of two words, high half
 * first, a value of 10^9 or more rejected and drawn again.
 */
function seeds(draw: () => number): () => number {
  return (): number => {
    for (;;) {
      const high: number = draw() & 32767;
      const low: number = draw() & 32767;
      const u: number = high * 32768 + low;
      if (u < 1000000000) return u + 1;
    }
  };
}

/**
 * `HumanRandomSeeds` is OMPL's seed generator (`RNGSeedGenerator`): a
 * `ranlux24_base` seeded once with the first seed, from which each generator
 * draws its local seed by `uniform_int_distribution<>(1, 1000000000)`, both as
 * libc++ implements them.
 *
 * Scenarios:
 *
 * 1. The reference engine written from the standard gives the standard's 10000th
 *    output of a default-constructed `ranlux24_base`, 7937952.
 * 2. Seeded with the default seed, the generator's first 200 seeds are the
 *    reference distribution's.
 * 3. Seeded with 12345 the same; every seed lies in [1, 10^9].
 * 4. A first seed of zero is the default seed, as libc++'s `seed(0)`.
 */
export function test_unit_motions_posture_random_seeds(): void {
  // 1. The reference engine.
  const engine: () => number = reference(HumanRandomSeeds.DEFAULT_SEED);
  let last: number = 0;
  for (let k: number = 0; k < 10000; ++k) last = engine();
  TestValidator.equals("the standard's 10000th output", last, 7937952);

  // 2 and 3. The seeds.
  const agree = (first: number): boolean => {
    const state: HumanRandomSeeds.IState = HumanRandomSeeds.create(first);
    const expected: () => number = seeds(reference(first));
    return Array.from({ length: 200 }, (): boolean => {
      const value: number = HumanRandomSeeds.next(state);
      return value === expected() && value >= 1 && value <= 1000000000;
    }).every((ok: boolean): boolean => ok);
  };
  TestValidator.predicate(
    "the default and another seed's sequences",
    agree(HumanRandomSeeds.DEFAULT_SEED) && agree(12345),
  );

  // 4. Zero.
  TestValidator.equals(
    "a zero seed is the default",
    HumanRandomSeeds.create(0),
    HumanRandomSeeds.create(HumanRandomSeeds.DEFAULT_SEED),
  );
}
