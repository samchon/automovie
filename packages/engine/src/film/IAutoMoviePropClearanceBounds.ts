import { IAutoMoviePropBox } from "@automovie/interface";

/**
 * One transformed keep-out volume, still carrying the id that declared it.
 *
 * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-use-clearance IAutoMoviePropClearanceBounds keeps object-use circulation checkable: One transformed keep-out volume, still carrying the id that declared it.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement IAutoMoviePropClearanceBounds realizes furnishing placement clearance: One transformed keep-out volume, still carrying the id that declared it.
 */
export interface IAutoMoviePropClearanceBounds extends IAutoMoviePropBox {
  /**
   * The clearance id this world volume came from.
   *
   * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-use-clearance IAutoMoviePropClearanceBounds.id keeps object-use circulation checkable: The clearance id this world volume came from.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement IAutoMoviePropClearanceBounds.id realizes furnishing placement clearance: The clearance id this world volume came from.
   */
  id: string;
}
