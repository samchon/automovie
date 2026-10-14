import type { IAutoMovieHumanStaticPartInterval } from "./IAutoMovieHumanStaticPartInterval";

/**
 * Source-model identity carried by one material-merged static primitive.
 * Element intervals address its final POSITION and index accessors, not bytes
 * or anatomical parts. Construction owns the ordered prepared populations;
 * the reader admits their complete partition without reconstructing a merge.
 *
 *
 * @evidence contracts/common.md#principled-implementation Versioned primitive extras map an exact source-model identity to prepared members whose intervals partition final POSITION and index accessors.
 * @evidence contracts/common.md#clear-and-simple-design Construction owns merge order and the reader validates the carried partition instead of reconstructing grouping from material names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source IDs are model identity, not authenticated provenance or inferred anatomy; malformed carried intervals must refuse.
 * @evidence contracts/common.md#meaningful-documentation Documents element rather than byte units, prepared order and complete partition ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This metadata shape performs no accessor traversal; readHumanStaticPartCorrespondence owns admission.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A carried per-primitive partition is not a cache or coordinated merge operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Metadata arrays belong to the writer/reader result owner; the interface retains no primitive or external resource.
 *
 *
 * @author Samchon
 */
export interface IAutoMovieHumanStaticPartCorrespondence {
  /** Supported metadata format, independent of glTF's version. */
  version: 1;

  /** ID of the source static model. */
  sourceModel: string;

  /** Prepared source members in this primitive's declared merge order. */
  parts: IAutoMovieHumanStaticPartInterval[];
}
