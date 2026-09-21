import { IAutoMovieFluidState } from "@automovie/interface";

/**
 * A stable 32-bit FNV-1a digest of one fluid state's exact bytes, as lowercase
 * hex.
 *
 * Two states digest alike only when every depth, velocity and ledger value is
 * bit-identical, so it is the compact evidence that a replay, a reordered seek,
 * or a second machine reproduced the reference state rather than merely a close
 * one.
 *
 * @evidence requirements/effects-and-simulation/clock-seek-and-determinism.md#effects-platform-determinism Records exact replay equality rather than an approximate visual match.
 * @evidence specifications/simulation-effects-and-sound/clocks-ordering-seek-and-checkpoints.md#numeric-platform-repeatability-class Provides a stable byte-level receipt for repeatability checks.
 * @author Samchon
 */
export const fluidStateDigest = (state: IAutoMovieFluidState): string => {
  const values = [
    state.step,
    ...state.depth,
    ...state.velocityX,
    ...state.velocityZ,
    state.volume,
    state.sourceVolume,
    state.drainVolume,
    state.outflowVolume,
  ];
  const view = new DataView(new ArrayBuffer(8));
  let hash = 0x811c9dc5;
  for (const value of values) {
    view.setFloat64(0, value, true);
    for (let byte = 0; byte < 8; ++byte) {
      hash = (hash ^ view.getUint8(byte)) >>> 0;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  }
  return hash.toString(16).padStart(8, "0");
};
