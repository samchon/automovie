/**
 * OMPL's seed generator (`RNGSeedGenerator`, github.com/ompl/ompl
 * src/ompl/util/src/RandomNumbers.cpp lines 51-112 at commit
 * 340bd214be6e87fe758a75e04203d665429b020f, BSD-3-Clause, Copyright (c) 2008,
 * Willow Garage, Inc.): a `std::ranlux24_base` seeded once with the first seed,
 * from which every random number generator draws its own local seed through
 * `std::uniform_int_distribution<>(1, 1000000000)` (`nextSeed`). The engine is
 * the C++ standard's `subtract_with_carry_engine<uint_fast32_t, 24, 10, 24>`,
 * seeded by its `linear_congruential_engine<uint_fast32_t, 40014, 0,
 * 2147483563>`, and the distribution's draw is the C++ standard library's: both
 * ported from libc++ (github.com/llvm/llvm-project
 * libcxx/include/__random/subtract_with_carry_engine.h, `seed` and
 * `operator()`, and libcxx/include/__random/uniform_int_distribution.h,
 * `__independent_bits_engine` and `uniform_int_distribution::operator()`, at
 * commit 93b1f81e03ef4c717a9d222b46f78c38bcff0a3f, Apache-2.0 WITH
 * LLVM-exception).
 *
 * The generator's state is an explicit record its caller owns.
 */
export namespace HumanRandomSeeds {
  /** The seed generator's state: the engine's 24 words, its carry and index. */
  export interface IState {
    /** The engine's words (`__x_`), 24 bits each. */
    words: number[];

    /** The carry (`__c_`). */
    carry: number;

    /** The next word's index (`__i_`). */
    index: number;
  }

  /**
   * The engine's default seed (`subtract_with_carry_engine::default_seed`,
   * 19780503), the first seed where none is set.
   */
  export const DEFAULT_SEED: number = 19780503;

  /**
   * A seed generator seeded with its first seed (`RNGSeedGenerator::setSeed`,
   * `sGen_.seed(seed)`).
   *
   * @param first The first seed, positive.
   * @returns The generator's state.
   */
  export function create(first: number): IState {
    // linear_congruential_engine<uint_fast32_t, 40014, 0, 2147483563>.
    let x: number = first % LCG_M;
    if (x === 0) x = 1;
    const words: number[] = [];
    for (let i: number = 0; i < R; ++i) {
      x = (LCG_A * x) % LCG_M;
      words.push(x % TWO24);
    }
    return { words, carry: words[R - 1] === 0 ? 1 : 0, index: 0 };
  }

  /**
   * The next local seed (`RNGSeedGenerator::nextSeed`): a uniform integer on
   * [1, 1000000000] by libc++'s `uniform_int_distribution`.
   *
   * @param state The generator, advanced.
   * @returns The seed.
   */
  export function next(state: IState): number {
    const lower: number = 1;
    const upper: number = 1000000000;
    const rp: number = upper - lower + 1;

    // w: the bits the range needs, one more where it is not a power of two.
    const dt: number = 32;
    let w: number = dt - Math.clz32(rp) - 1;
    if ((rp & (0xffffffff >>> (dt - w))) !== 0) ++w;
    let u: number;
    do u = independentBits(state, w);
    while (u >= rp);
    return u + lower;
  }

  /**
   * Libc++'s `__independent_bits_engine` over the engine (its range 2^24) for a
   * 32-bit result of `w` bits: `n` draws of `w0` bits each (the last `n - n0`
   * of `w0 + 1`), each draw rejected above the largest multiple of its width.
   */
  function independentBits(state: IState, w: number): number {
    const rRange: number = TWO24;
    const m: number = 24;
    const wdt: number = 32;
    let n: number = Math.floor(w / m) + (w % m !== 0 ? 1 : 0);
    let w0: number = Math.floor(w / n);
    let y0: number = w0 < wdt ? Math.floor(rRange / 2 ** w0) * 2 ** w0 : 0;
    if (rRange - y0 > Math.floor(y0 / n)) {
      ++n;
      w0 = Math.floor(w / n);
      y0 = w0 < wdt ? Math.floor(rRange / 2 ** w0) * 2 ** w0 : 0;
    }
    const n0: number = n - (w % n);
    const y1: number =
      w0 < wdt - 1 ? Math.floor(rRange / 2 ** (w0 + 1)) * 2 ** (w0 + 1) : 0;
    const mask0: number = w0 > 0 ? 2 ** w0 - 1 : 0;
    const mask1: number = 2 ** (w0 + 1) - 1;
    let sp: number = 0;
    for (let k: number = 0; k < n0; ++k) {
      let u: number;
      do u = draw(state);
      while (u >= y0);
      sp = sp * 2 ** w0 + (u & mask0);
    }
    for (let k: number = n0; k < n; ++k) {
      let u: number;
      do u = draw(state);
      while (u >= y1);
      sp = sp * 2 ** (w0 + 1) + (u & mask1);
    }
    return sp % 2 ** 32;
  }

  /** The engine's next word (`subtract_with_carry_engine::operator()`). */
  function draw(state: IState): number {
    const x: number[] = state.words;
    const xs: number = x[(state.index + (R - S)) % R]!;
    const xr: number = x[state.index]!;
    const carry: number =
      state.carry === 0 ? (xs < xr ? 1 : 0) : xs !== 0 ? (xs <= xr ? 1 : 0) : 1;
    const value: number = (((xs - xr - state.carry) % TWO24) + TWO24) % TWO24;
    x[state.index] = value;
    state.carry = carry;
    state.index = (state.index + 1) % R;
    return value;
  }
}

/** The engine's long lag (`r`). */
const R: number = 24;

/** The engine's short lag (`s`). */
const S: number = 10;

/** 2^24, the engine's range (`w` = 24 bits). */
const TWO24: number = 16777216;

/** The seeding engine's multiplier. */
const LCG_A: number = 40014;

/** The seeding engine's modulus. */
const LCG_M: number = 2147483563;
