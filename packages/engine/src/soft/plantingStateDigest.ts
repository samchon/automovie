import { IAutoMoviePlantingState } from "@automovie/interface";

/**
 * Produce a deterministic 32-bit FNV-1a diagnostic of selected branch and leaf
 * geometry encoded as little-endian float64 bytes. Equal digests can collide
 * and omit ids, domain metadata and authored relationships.
 */
export const plantingStateDigest: (state: IAutoMoviePlantingState) => string = (
  state: IAutoMoviePlantingState,
): string => {
  const values: number[] = [
    state.stage,
    state.branches.length,
    state.leaves.length,
  ];
  for (const branch of state.branches)
    values.push(
      branch.level,
      branch.start.x,
      branch.start.y,
      branch.start.z,
      branch.end.x,
      branch.end.y,
      branch.end.z,
      branch.radiusStart,
      branch.radiusEnd,
      branch.pruned ? 1 : 0,
    );
  for (const leaf of state.leaves)
    values.push(
      leaf.translation.x,
      leaf.translation.y,
      leaf.translation.z,
      leaf.rotation.x,
      leaf.rotation.y,
      leaf.rotation.z,
      leaf.rotation.w,
      leaf.scale.x,
      leaf.scale.y,
      leaf.scale.z,
    );
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
