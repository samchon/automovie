/**
 * One document a warm pass could not draw, with the reason.
 *
 * @evidence contracts/common.md#principled-implementation An unsuccessful warm capture retains its document ID and actual failure reason together.
 * @evidence contracts/common.md#clear-and-simple-design One failure record lets warming progress report errors without owning capture or retry behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed warm document remains a failure and is not counted as a successfully drawn thumbnail.
 * @evidence contracts/common.md#meaningful-documentation Names the document address and the reason its capture failed.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review An unsuccessful warm capture retains its document ID and actual failure reason together.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review One failure record lets warming progress report errors without owning capture or retry behavior.
 * @author Samchon
 */
export interface IHumanViewerWarmFailure {
  /**
   * Document id.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Document id. An unsuccessful warm capture retains its document ID and actual failure reason together.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Document id. One failure record lets warming progress report errors without owning capture or retry behavior.
   */
  id: string;

  /**
   * Why its capture failed.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Why its capture failed. An unsuccessful warm capture retains its document ID and actual failure reason together.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Why its capture failed. One failure record lets warming progress report errors without owning capture or retry behavior.
   */
  reason: string;
}
