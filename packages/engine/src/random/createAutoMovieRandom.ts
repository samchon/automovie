import type { IAutoMovieRandom } from "./IAutoMovieRandom";
import { deriveAutoMovieSeed } from "./deriveAutoMovieSeed";
import { philoxAutoMovie4x32 } from "./philoxAutoMovie4x32";

/**
 * A pure, counter-based random stream keyed by a 64-bit seed.
 *
 * Every value is the Philox4x32-10 block ({@link philoxAutoMovie4x32}) of
 * its own counter under the seed's key, so a value depends on the seed and
 * its index alone: any index can be read first, in any order, from any
 * thread, and seeking costs one block. Index `i` reads the block of counter
 * `[i mod 2^32, floor(i / 2^32), 0, 0]`, so a stream holds 2^53 indices (the
 * integers a double counts exactly), each a fresh block, and never cycles
 * within them. Independent streams come from {@link IAutoMovieRandom.stream},
 * which keys a new stream by stable ids, never by ordinals.
 *
 * @param seed Sixteen hexadecimal digits, as {@link deriveAutoMovieSeed} returns.
 * @returns The stream.
 */
export function createAutoMovieRandom(seed: string): IAutoMovieRandom {
  if (!/^[0-9a-fA-F]{16}$/.test(seed))
    throw new Error(
      `An AutoMovie random seed is sixteen hexadecimal digits: ${seed}`,
    );
  const key: [number, number] = [
    parseInt(seed.slice(8), 16) >>> 0,
    parseInt(seed.slice(0, 8), 16) >>> 0,
  ];
  const block = (index: number): [number, number, number, number] => {
    if (!Number.isSafeInteger(index) || index < 0)
      throw new Error(
        `An AutoMovie random index is a nonnegative safe integer: ${index}`,
      );
    return philoxAutoMovie4x32(
      [index >>> 0, Math.floor(index / 0x100000000) >>> 0, 0, 0],
      key,
    );
  };
  return {
    seed: seed.toLowerCase(),
    block,
    uint32: (index: number): number => block(index)[0],
    float: (index: number): number => {
      // 53 random bits: 27 from the first word and 26 from the second.
      const [a, b]: [number, number, number, number] = block(index);
      return ((a >>> 5) * 67108864 + (b >>> 6)) / 9007199254740992;
    },
    stream: (...ids: string[]): IAutoMovieRandom =>
      createAutoMovieRandom(deriveAutoMovieSeed(seed.toLowerCase(), ...ids)),
  };
}
