import { IAutoMoviePlantingState } from "@automovie/interface";

/**
 * A stable 32-bit FNV-1a digest of one derived planting structure, as lowercase
 * hex.
 *
 * Two structures digest alike only when every coordinate, quaternion component
 * and scale is bit-identical, so it is the compact evidence that a
 * re-derivation or a second machine reproduced the reference plant rather than
 * merely a similar one.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Records exact equality of a deterministically derived planting state.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Provides the repeatability receipt for the generated planting structure.
 * @author Samchon
 */
export const plantingStateDigest = (state: IAutoMoviePlantingState): string => {
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
