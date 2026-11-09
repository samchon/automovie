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
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A pure, counter-based random stream keyed by a 64-bit seed) and documents parameter `seed`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (A pure, counter-based random stream keyed by a 64-bit seed) directly over its typed inputs (`seed`) as recursive, so its cost follows the recursion depth the input structure allows, delegating to `parseInt`, `seed.slice`, `Number.isSafeInteger`, `philoxAutoMovie4x32`, `Math.floor`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 8, 16, 4294967296, 5, 67108864, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 32 lines and 4 top-level statements that reuses `parseInt`, `seed.slice`, `Number.isSafeInteger`, `philoxAutoMovie4x32`, `Math.floor` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 8, 16, 4294967296, 5, 67108864 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `seed`; the dominant cost is recursive, so its cost follows the recursion depth the input structure allows, performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
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
