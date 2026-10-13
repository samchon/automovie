import { IAutoMovieSoftBodyState } from "@automovie/interface";
/** Produce a deterministic 32-bit FNV-1a diagnostic of selected numeric cloth fields encoded as little-endian float64 bytes. Equal digests are not proof of equal states: collisions exist and domain/time metadata is omitted.
 *
 * @evidence contracts/common.md#principled-implementation Step, positions, velocities, maxSpeed, maxStrain and contacts form the ordered byte stream; identical selected bytes hash identically, while a 32-bit result cannot uniquely identify the field or certify cross-host replay.
 * @evidence contracts/common.md#clear-and-simple-design One diagnostic helper serves portable determinism tests; no production/viewer consumer currently adopts this digest as content identity or admission evidence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture-specific expected hash is built into production; collision limitations and omitted metadata remain explicit rather than being advertised as bit-identical proof.
 * @evidence contracts/common.md#meaningful-documentation States exact selected fields, encoding, collision limitation and test-only reach.
 * @evidence contracts/performance.md#efficient-algorithms For P position and V velocity scalars, flattening and eight-byte hashing cost O(P+V) time and O(P+V) temporary numeric storage, plus one eight-byte view.
 * @evidence contracts/performance.md#reuse-equivalent-work The byte view is reused for every scalar within a call; independent states are hashed anew and no identity cache assumes unchanged arrays.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Flattened values and the byte view are local; only a fixed eight-character hex string survives, without retaining the input arrays.
 *
 * @author Samchon
 */
export const softBodyStateDigest: (state: IAutoMovieSoftBodyState) => string = (state: IAutoMovieSoftBodyState): string => {
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
};
