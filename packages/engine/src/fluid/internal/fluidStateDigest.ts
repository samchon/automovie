import { IAutoMovieFluidState } from "@automovie/interface";

/**
 * A 32-bit FNV-1a digest of selected fluid-state numbers, as eight lowercase
 * hex digits.
 *
 * The bytes are the little-endian IEEE-754 doubles of step, every depth, every
 * x and z face velocity, then the volume, source, drain and outflow ledgers, in
 * that order; domain, time and array lengths are omitted. Equal serialized
 * sequences hash alike, and a mismatch identifies a difference in that
 * sequence. A match cannot prove state identity: the 32-bit hash collides,
 * omitted fields are invisible, and array partition boundaries are not encoded.
 * No collision probability is established for this workload.
 *
 * Signed zero is serialized distinctly. DataView serializes the JavaScript
 * Number value; NaN payload preservation across runtimes is not guaranteed, and
 * this helper performs no finite-state admission.
 */
export function fluidStateDigest(state: IAutoMovieFluidState): string {
  const view: DataView = new DataView(new ArrayBuffer(8));
  let hash: number = 0x811c9dc5;
  /**
   * Serialize one Number into the reused eight-byte view and fold its bytes in
   * order into the call-local unsigned hash; constant work retains no per-value
   * history.
   */
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
}
