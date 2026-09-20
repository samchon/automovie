import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One leaf occurrence, as a lossless full-TRS instance.
 *
 * Translation, a unit quaternion and a per-axis scale, which is exactly what
 * GPU instancing consumes. A leaf is never reduced to a yaw or to one uniform
 * number, because a reduction is a fact about the plant that nobody authored.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `IAutoMoviePlantingLeaf` as the portable data boundary for the interior plant placement state requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMoviePlantingLeaf` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMoviePlantingLeaf {
  /**
   * Stable leaf identity within the derived structure.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `id` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `id` for the interior space soft furnishing planting system contract.
   */
  id: string;

  /**
   * Id of the branch bearing this leaf.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `branch` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `branch` for the interior space soft furnishing planting system contract.
   */
  branch: string;

  /**
   * Recipe-frame position of the leaf's origin.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `translation` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `translation` for the interior space soft furnishing planting system contract.
   */
  translation: IAutoMovieVector3;

  /**
   * Unit quaternion in glTF `(x, y, z, w)` order.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `rotation` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `rotation` for the interior space soft furnishing planting system contract.
   */
  rotation: IAutoMovieQuaternion;

  /**
   * Per-axis scale of the prototype leaf; each strictly positive.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `scale` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `scale` for the interior space soft furnishing planting system contract.
   */
  scale: IAutoMovieVector3;
}
