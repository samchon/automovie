import type { AutoMovieHumanBodyPartId } from "../identity/AutoMovieHumanBodyPartId";
import type { IAutoMovieHumanBodyAnatomicalResolution } from "./IAutoMovieHumanBodyAnatomicalResolution";
import type { IAutoMovieHumanBodyGeneratedMaterialPart } from "./IAutoMovieHumanBodyGeneratedMaterialPart";
import type { IAutoMovieHumanBodyGeneratedPart } from "./IAutoMovieHumanBodyGeneratedPart";

/**
 * A named internal part resolved with validation or explicitly unavailable.
 *
 * Distributing over the generated-part union binds `id`, tissue material and successful value together, so a right femur cannot answer as left deltoid. Availability remains per part; absent imaging never silently creates bone.
 *
 * @evidence contracts/common.md#principled-implementation Distributive resolution binds each closed part ID to its matching generated tissue/value or explicit unavailable record.
 * @evidence contracts/common.md#clear-and-simple-design The type reuses catalogue and shared resolution owners instead of duplicating per-part success/failure records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A femur cannot resolve as a deltoid and missing imaging never silently supplies generated bone.
 * @evidence contracts/common.md#meaningful-documentation The prose explains correlated identity/material/value and separate per-part availability.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Conditional resolution typing performs no anatomical generation or geometry validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Part-result alternatives establish no equivalent generator-request cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The resolution declaration owns no generated tissue lifetime or active computation.
 * @author Samchon
 */
export type IAutoMovieHumanBodyPartResolution<
  Id extends AutoMovieHumanBodyPartId = AutoMovieHumanBodyPartId,
> = Id extends AutoMovieHumanBodyPartId
  ? IAutoMovieHumanBodyAnatomicalResolution<
      Id,
      Extract<
        IAutoMovieHumanBodyGeneratedPart,
        IAutoMovieHumanBodyGeneratedMaterialPart<Id, string>
      >
    >
  : never;
