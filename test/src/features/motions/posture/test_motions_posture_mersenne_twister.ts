import { HumanMersenneTwister } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanMersenneTwister` is MT19937 (Matsumoto and Nishimura 1998): seeded by
 * `init_genrand`, its outputs are the reference sequence.
 *
 * The C++ standard fixes the reference: `std::mt19937` with the default seed
 * 5489 outputs 3499211612 and 581869302 first, and 4123659995 as its 10000th
 * output ([rand.predef]).
 *
 * Scenarios:
 *
 * 1. Seed 5489: the first two outputs and the 10000th.
 * 2. `uniform01` composes two outputs, the first the low word, over 2^64.
 * 3. `uniformInt` stays within its bounds.
 */
export function test_motions_posture_mersenne_twister(): void {
  // 1. The reference outputs.
  const state: HumanMersenneTwister.IState = HumanMersenneTwister.create(5489);
  const first: number = HumanMersenneTwister.next(state);
  const second: number = HumanMersenneTwister.next(state);
  let last: number = second;
  for (let k: number = 3; k <= 10000; ++k)
    last = HumanMersenneTwister.next(state);
  TestValidator.equals(
    "the reference outputs",
    [first, second, last],
    [3499211612, 581869302, 4123659995],
  );

  // 2. Two words make one double.
  const fresh: HumanMersenneTwister.IState = HumanMersenneTwister.create(5489);
  const two32: number = 4294967296;
  TestValidator.equals(
    "a double from the low word and the high word",
    HumanMersenneTwister.uniform01(fresh),
    (3499211612 + 581869302 * two32) / (two32 * two32),
  );

  // 3. Integers within bounds.
  const ints: HumanMersenneTwister.IState = HumanMersenneTwister.create(7);
  const drawn: number[] = Array.from({ length: 200 }, (): number =>
    HumanMersenneTwister.uniformInt(ints, -2, 3),
  );
  TestValidator.predicate(
    "every integer lies within its bounds",
    drawn.every((v: number): boolean => [-2, -1, 0, 1, 2, 3].includes(v)),
  );
}
