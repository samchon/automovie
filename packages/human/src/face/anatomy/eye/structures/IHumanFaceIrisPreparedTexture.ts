import type { IHumanFaceIrisPaintedEye } from "./IHumanFaceIrisPaintedEye";

/**
 * A decoded eye texture and the iris texels of each eye painted on it.
 *
 *
 * @evidence contracts/common.md#principled-implementation A decoded row-major RGBA image retains the selected eyes that share its material.
 * @evidence contracts/common.md#clear-and-simple-design Preparation owns material-keyed decode reuse and painting owns copied output PNG bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Material identity is the admitted equivalence premise rather than evidence of arbitrary texture-byte equality.
 * @evidence contracts/common.md#meaningful-documentation Fields state pixel dimensions, byte layout and per-eye prepared population.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceIrisPreparedTexture is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceIrisPreparedTexture declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceIrisPreparedTexture itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
 */
export interface IHumanFaceIrisPreparedTexture {
  /** Image width, pixels. */
  width: number;

  /** Image height, pixels. */
  height: number;

  /** Row-major RGBA bytes. */
  rgba: Uint8Array;

  /** Eyes painted on this texture. */
  eyes: IHumanFaceIrisPaintedEye[];
}
