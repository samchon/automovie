import { IAutoMovieSoftBodyState } from "@automovie/interface";

/*
 * Produce a deterministic 32-bit FNV-1a diagnostic of selected numeric cloth
 * fields encoded as little-endian float64 bytes. Equal digests are not proof of
 * equal states: collisions exist and domain/time metadata is omitted.
 */
export function softBodyStateDigest(state: IAutoMovieSoftBodyState): string {
  const values: number[] = [
    state.step,
    ...state.positions,
    ...state.velocities,
    state.maxSpeed,
    state.maxStrain,
    state.contacts,
  ];
  const view: DataView<ArrayBuffer> = new DataView(new ArrayBuffer(8));
  let hash: number = 0x811c9dc5;
  for (const value of values) {
    view.setFloat64(0, value, true);
    for (let byte: number = 0; byte < 8; ++byte) {
      hash = (hash ^ view.getUint8(byte)) >>> 0;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  }
  return hash.toString(16).padStart(8, "0");
}
