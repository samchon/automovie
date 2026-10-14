import { IAutoMovieFluidState } from "@automovie/interface";

/**
 * A 32-bit FNV-1a digest of selected fluid-state numbers, as eight lowercase hex digits.
 *
 * The bytes are the little-endian IEEE-754 doubles of step, every depth, every x and z face velocity, then the volume, source, drain and outflow ledgers, in that order; domain, time and array lengths are omitted. Equal serialized sequences hash alike, and a mismatch identifies a difference in that sequence. A match cannot prove state identity: the 32-bit hash collides, omitted fields are invisible, and array partition boundaries are not encoded. No collision probability is established for this workload.
 *
 * Signed zero is serialized distinctly. DataView serializes the JavaScript Number value; NaN payload preservation across runtimes is not guaranteed, and this helper performs no finite-state admission.
 *
 * @evidence contracts/common.md#principled-implementation Applies FNV-1a to eight little-endian DataView bytes per selected Number, using Math.imul and unsigned wrapping. Finite binary64 values and signed zero have explicit serialization; NaN payload portability and collision freedom are not promised, and omitted ids/times/lengths prevent whole-record identity claims.
 * @evidence contracts/common.md#clear-and-simple-design One function over the state's numeric fields in a fixed order, with no intermediate concatenation and no dependency on a hashing library.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field is rounded before hashing to make near states agree, and no state or caller is special-cased.
 * @evidence contracts/common.md#meaningful-documentation Gives the hash/output, serialization order, omitted fields and boundaries, signed-zero/NaN limits and why equality is not certified.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the `cells + faces + 5` numbers with a single eight-byte scratch view, `O(cells + faces)` time and constant extra space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Hashes the state it is given once per call and caches nothing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the eight-byte scratch buffer dies with the call.
 */
export const fluidStateDigest: (state: IAutoMovieFluidState) => string = (state: IAutoMovieFluidState): string => {
  const view: DataView = new DataView(new ArrayBuffer(8));
  let hash: number = 0x811c9dc5;
  /** Serialize one Number into the reused eight-byte view and fold its bytes in order into the call-local unsigned hash; constant work retains no per-value history. */
  const absorb: (value: number) => void = (value: number): void => {
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
