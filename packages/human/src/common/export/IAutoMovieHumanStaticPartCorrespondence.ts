import type { IAutoMovieHumanStaticPartInterval } from "./IAutoMovieHumanStaticPartInterval";

/**
 * Source-model identity carried by one material-merged static primitive.
 * Element intervals address its final POSITION and index accessors, not bytes
 * or anatomical parts. Construction owns the ordered prepared populations;
 * the reader admits their complete partition without reconstructing a merge.
 *
 * @evidence contracts/common.md#principled-implementation Separates source IDs from material names and binds intervals to their carrying primitive.
 * @evidence contracts/common.md#clear-and-simple-design One versioned record describes one actual merged primitive.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomical qualification or authored geometry is inferred from a source ID.
 * @evidence contracts/common.md#meaningful-documentation Specifies element units, ownership and the source identity limitation.
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
