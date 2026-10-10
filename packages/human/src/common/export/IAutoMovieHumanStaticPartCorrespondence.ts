import type { IAutoMovieHumanStaticPartInterval } from "./IAutoMovieHumanStaticPartInterval";

/**
 * Source-model identity carried by one material-merged static primitive.
 * Element intervals address its final POSITION and index accessors, not bytes
 * or anatomical parts. Construction owns the ordered prepared populations;
 * the reader admits their complete partition without reconstructing a merge.
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
