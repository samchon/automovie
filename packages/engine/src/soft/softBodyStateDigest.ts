import type { IAutoMovieSoftBodyState } from "@automovie/interface";

/**
 * A stable 32-bit FNV-1a digest of one soft-body state's exact bytes, as
 * lowercase hex.
 *
 * Two states digest alike only when every position, velocity and measurement is
 * bit-identical, so it is the compact evidence that a replay, a reordered seek,
 * or a second machine reproduced the reference state rather than merely a close
 * one.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Records exact equality of one computed soft-body state.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Provides the repeatability receipt for a fixed-step transition result.
 * @author Samchon
 */
export const softBodyStateDigest = (state: IAutoMovieSoftBodyState): string => {
  const values = [
    state.step,
    ...state.positions,
    ...state.velocities,
    state.maxSpeed,
    state.maxStrain,
    state.contacts,
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
