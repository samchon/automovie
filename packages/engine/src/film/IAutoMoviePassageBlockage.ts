/**
 * One passage a staged volume intrudes on.
 *
 * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-use-clearance IAutoMoviePassageBlockage keeps object-use circulation checkable: One passage a staged volume intrudes on.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement IAutoMoviePassageBlockage realizes furnishing placement clearance: One passage a staged volume intrudes on.
 */
export interface IAutoMoviePassageBlockage {
  /**
   * Which passage family the blocked id belongs to.
   *
   * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-use-clearance IAutoMoviePassageBlockage.kind keeps object-use circulation checkable: Which passage family the blocked id belongs to.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement IAutoMoviePassageBlockage.kind realizes furnishing placement clearance: Which passage family the blocked id belongs to.
   */
  kind: "opening" | "connector";
  /**
   * Stable opening or connector id inside the environment.
   *
   * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-use-clearance IAutoMoviePassageBlockage.id keeps object-use circulation checkable: Stable opening or connector id inside the environment.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement IAutoMoviePassageBlockage.id realizes furnishing placement clearance: Stable opening or connector id inside the environment.
   */
  id: string;
}
