/*
 * The Mersenne Twister MT19937 (Matsumoto and Nishimura 1998, "Mersenne
 * twister: a 623-dimensionally equidistributed uniform pseudo-random number
 * generator", ACM TOMACS 8(1):3-30), ported from the authors' reference code
 * `mt19937ar.c` (`init_genrand` and `genrand_int32`, "A C-program for MT19937,
 * with initialization improved 2002/1/26", BSD-3-Clause, Copyright (C) 1997 -
 * 2002, Makoto Matsumoto and Takuji Nishimura), with the draws OMPL's random
 * number generator makes of it (`ompl::RNG`, github.com/ompl/ompl
 * src/ompl/util/RandomNumbers.h at commit
 * 340bd214be6e87fe758a75e04203d665429b020f, BSD-3-Clause, Copyright (c) 2008,
 * Willow Garage, Inc.: `uniform01`, `uniformReal`, `uniformInt`), whose
 * `std::uniform_real_distribution` over `std::mt19937` draws its double by the
 * C++ standard's `generate_canonical` from two 32-bit outputs.
 *
 * The generator's state is an explicit record its caller owns; a draw advances
 * it, so one seed gives one sequence.
 */
export namespace HumanMersenneTwister {
  /*
   * The state of one generator: the 624 words and the next one's index.
   */
  export interface IState {
    /*
     * The state vector (`mt`), 32-bit words.
     */
    words: Uint32Array;

    /*
     * The next word's index (`mti`); 624 asks for the next 624 words.
     */
    index: number;
  }

  /*
   * A generator seeded with a word (`init_genrand`).
   * Parameter seed: The seed, a 32-bit unsigned integer.
   * Returns: The generator's state.
   */
  export function create(seed: number): IState {
    const words: Uint32Array = new Uint32Array(N);
    words[0] = seed >>> 0;
    for (let i: number = 1; i < N; ++i) {
      const previous: number = words[i - 1]! ^ (words[i - 1]! >>> 30);
      words[i] = (Math.imul(1812433253, previous) + i) >>> 0;
    }
    return { words, index: N };
  }

  /*
   * The next 32-bit output (`genrand_int32`).
   * Parameter state: The generator, advanced by one output.
   * Returns: An integer on [0, 0xffffffff].
   */
  export function next(state: IState): number {
    const mt: Uint32Array = state.words;
    if (state.index >= N) {
      let kk: number = 0;
      for (; kk < N - M; ++kk) {
        const y: number = (mt[kk]! & UPPER_MASK) | (mt[kk + 1]! & LOWER_MASK);
        mt[kk] = mt[kk + M]! ^ (y >>> 1) ^ (y & 1 ? MATRIX_A : 0);
      }
      for (; kk < N - 1; ++kk) {
        const y: number = (mt[kk]! & UPPER_MASK) | (mt[kk + 1]! & LOWER_MASK);
        mt[kk] = mt[kk + (M - N)]! ^ (y >>> 1) ^ (y & 1 ? MATRIX_A : 0);
      }
      const y: number = (mt[N - 1]! & UPPER_MASK) | (mt[0]! & LOWER_MASK);
      mt[N - 1] = mt[M - 1]! ^ (y >>> 1) ^ (y & 1 ? MATRIX_A : 0);
      state.index = 0;
    }
    let y: number = mt[state.index++]!;

    // Tempering.
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }

  /*
   * A double on [0, 1) (`RNG::uniform01`): the C++ standard's
   * `generate_canonical` of 53 bits from two 32-bit outputs, the first the low
   * word, `(g0 + g1 · 2^32) / 2^64`, the largest double under 1 where the sum
   * rounds to 1.
   * Parameter state: The generator, advanced by two outputs.
   * Returns: The draw.
   */
  export function uniform01(state: IState): number {
    const low: number = next(state);
    const high: number = next(state);
    const value: number = (low + high * TWO32) / (TWO32 * TWO32);
    return value < 1 ? value : 1 - Number.EPSILON / 2;
  }

  /*
   * A double on [lower, upper) (`RNG::uniformReal`).
   * Parameter state: The generator.
   * Parameter lower: The least value.
   * Parameter upper: The bound above every value.
   * Returns: The draw.
   */
  export function uniformReal(
    state: IState,
    lower: number,
    upper: number,
  ): number {
    return (upper - lower) * uniform01(state) + lower;
  }

  /*
   * An integer on [lower, upper] (`RNG::uniformInt`): the floor of a real draw
   * on [lower, upper + 1), the upper bound where it rounds above it.
   * Parameter state: The generator.
   * Parameter lower: The least value.
   * Parameter upper: The greatest value.
   * Returns: The draw.
   */
  export function uniformInt(
    state: IState,
    lower: number,
    upper: number,
  ): number {
    const r: number = Math.floor(uniformReal(state, lower, upper + 1));
    return r > upper ? upper : r;
  }
}

/*
 * The state's length (`N`).
 */
const N: number = 624;

/*
 * The middle word's offset (`M`).
 */
const M: number = 397;

/*
 * The constant vector a (`MATRIX_A`).
 */
const MATRIX_A: number = 0x9908b0df;

/*
 * The most significant w - r bits (`UPPER_MASK`).
 */
const UPPER_MASK: number = 0x80000000;

/*
 * The least significant r bits (`LOWER_MASK`).
 */
const LOWER_MASK: number = 0x7fffffff;

/*
 * 2^32, the range of one output.
 */
const TWO32: number = 4294967296;
