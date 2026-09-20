import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMoviePlantingExtent } from "./IAutoMoviePlantingExtent";
import { IAutoMoviePlantingScaleRange } from "./IAutoMoviePlantingScaleRange";

/**
 * A deterministic arrangement of one planting recipe: a planter group, a green
 * wall, a bed of reeds, a row of potted ferns.
 *
 * Repetition is generated, never hand-duplicated. Every member is a seeded
 * placement of the same recipe, and members are refused rather than overlapped
 * when they cannot honour {@link minSpacing}, so a cluster is a stated
 * arrangement with a stated collision rule instead of a list of coordinates
 * somebody typed.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-collision-clearance Exposes `IAutoMoviePlantingCluster` as the portable data boundary for the interior soft collision clearance requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMoviePlantingCluster` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMoviePlantingCluster {
  /**
   * Stable cluster identity within the production.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-collision-clearance Exposes `id` as the portable data boundary for the interior soft collision clearance requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `id` for the interior space soft furnishing planting system contract.
   */
  id: string;

  /**
   * Id of the planting recipe every member grows from.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-collision-clearance Exposes `domain` as the portable data boundary for the interior soft collision clearance requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `domain` for the interior space soft furnishing planting system contract.
   */
  domain: string;

  /**
   * Members to place; an integer of at least 1.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-collision-clearance Exposes `count` as the portable data boundary for the interior soft collision clearance requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `count` for the interior space soft furnishing planting system contract.
   */
  count: number;

  /**
   * World centre of the placement rectangle.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-collision-clearance Exposes `anchor` as the portable data boundary for the interior soft collision clearance requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `anchor` for the interior space soft furnishing planting system contract.
   */
  anchor: IAutoMovieVector3;

  /**
   * Half-extent of the placement rectangle in metres; each `>= 0`.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-collision-clearance Exposes `extent` as the portable data boundary for the interior soft collision clearance requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `extent` for the interior space soft furnishing planting system contract.
   */
  extent: IAutoMoviePlantingExtent;

  /**
   * Deterministic seed; any safe integer.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-collision-clearance Exposes `seed` as the portable data boundary for the interior soft collision clearance requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `seed` for the interior space soft furnishing planting system contract.
   */
  seed: number;

  /**
   * Centre-to-centre distance members must keep, in metres; `>= 0`. A member
   * that cannot be placed within {@link attempts} tries is refused and counted,
   * never squeezed in: a cluster that quietly overlapped would be a cluster
   * whose author was told nothing and whose frames changed anyway.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-collision-clearance Exposes `minSpacing` as the portable data boundary for the interior soft collision clearance requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `minSpacing` for the interior space soft furnishing planting system contract.
   */
  minSpacing: number;

  /**
   * Seeded placement attempts per member; an integer of at least 1.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-collision-clearance Exposes `attempts` as the portable data boundary for the interior soft collision clearance requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `attempts` for the interior space soft furnishing planting system contract.
   */
  attempts: number;

  /**
   * Per-axis scale range every member is drawn from.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-collision-clearance Exposes `scale` as the portable data boundary for the interior soft collision clearance requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `scale` for the interior space soft furnishing planting system contract.
   */
  scale: IAutoMoviePlantingScaleRange;

  /**
   * Seeded turn about world `+y`, in `[0, 1]`. `0` faces every member the same
   * way; `1` turns each anywhere. The turn is blended toward identity as a
   * normalized quaternion interpolation, so a partial jitter is a partial
   * rotation rather than a scaled angle no trigonometry-free derivation could
   * reproduce exactly.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-collision-clearance Exposes `yawJitter` as the portable data boundary for the interior soft collision clearance requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `yawJitter` for the interior space soft furnishing planting system contract.
   */
  yawJitter: number;
}
