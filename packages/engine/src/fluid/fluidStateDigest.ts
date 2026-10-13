import { IAutoMovieFluidState } from "@automovie/interface";

/**
 * A stable 32-bit FNV-1a digest of one fluid state's exact bytes, as eight
 * lowercase hex digits.
 *
 * The bytes are the little-endian IEEE-754 doubles of `step`, every depth,
 * every x and z face velocity, then the volume, source, drain and outflow
 * ledgers, in that order; `domain` and `time` are not hashed. Bit-identical
 * states always digest alike, so a mismatch proves a replay, a reordered seek
 * or a second machine diverged. A match is strong but not certain evidence of
 * identity: two different states collide with probability about `2⁻³²`, so a
 * test that must prove equality compares the arrays.
 *
 * @evidence contracts/common.md#principled-implementation FNV-1a over each value's eight little-endian `DataView` bytes, so the digest depends on exact bit patterns, including the sign of zero and NaN payloads, not on decimal formatting; its premise is that a 32-bit non-cryptographic hash is enough to flag divergence, not to prove equality.
 * @evidence contracts/common.md#clear-and-simple-design One function over the state's numeric fields in a fixed order, with no intermediate concatenation and no dependency on a hashing library.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field is rounded before hashing to make near states agree, and no state or caller is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the hash, the output form, the exact byte order and the fields left out, and what a mismatch and a match each prove.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the `cells + faces + 5` numbers with a single eight-byte scratch view, `O(cells + faces)` time and constant extra space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Hashes the state it is given once per call and caches nothing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the eight-byte scratch buffer dies with the call.
 */
export const fluidStateDigest = (state: IAutoMovieFluidState): string => {
  const view: DataView = new DataView(new ArrayBuffer(8));
  let hash: number = 0x811c9dc5;
  const absorb = (value: number): void => {
    view.setFloat64(0, value, true);
    for (let byte: number = 0; byte < 8; ++byte) {
      hash = (hash ^ view.getUint8(byte)) >>> 0;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  };
  absorb(state.step);
  for (const value of state.depth) absorb(value);
  for (const value of state.velocityX) absorb(value);
  for (const value of state.velocityZ) absorb(value);
  absorb(state.volume);
  absorb(state.sourceVolume);
  absorb(state.drainVolume);
  absorb(state.outflowVolume);
  return hash.toString(16).padStart(8, "0");
};
