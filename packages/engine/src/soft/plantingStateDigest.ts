import { IAutoMoviePlantingState } from "@automovie/interface";

/** Produce a deterministic 32-bit FNV-1a diagnostic of selected branch and leaf geometry encoded as little-endian float64 bytes. Equal digests can collide and omit ids, domain metadata and authored relationships.
 *
 * @evidence contracts/common.md#principled-implementation Stage/counts, branch level/endpoints/radii/pruned flag and leaf TRS form a fixed ordered numeric stream; identical selected bytes hash identically, but digest equality does not prove geometric or semantic identity.
 * @evidence contracts/common.md#clear-and-simple-design Portable planting determinism/pruning tests share this diagnostic; no production/viewer consumer currently treats it as validated content identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The helper contains no fixture hash or platform exception, and its 32-bit collision and omitted-id limits are stated rather than promising exact replay proof.
 * @evidence contracts/common.md#meaningful-documentation States selected geometry, byte encoding, omitted semantics and actual test-only reach.
 * @evidence contracts/performance.md#efficient-algorithms For B branches and L leaves, flattening and byte hashing cost O(B+L) time and temporary numeric storage, with one reused eight-byte view.
 * @evidence contracts/performance.md#reuse-equivalent-work The per-call view is reused across all scalars; changed tree order or geometry requires recomputation without a persistent digest cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only fixed-size hex output transfers; temporary values and view are released, and no branch/leaf object is retained.
 *
 * @author Samchon
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
