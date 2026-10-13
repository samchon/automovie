import { IAutoMovieHeadBrow } from "./IAutoMovieHeadBrow";
import { IAutoMovieHeadCheek } from "./IAutoMovieHeadCheek";
import { IAutoMovieHeadEyes } from "./IAutoMovieHeadEyes";
import { IAutoMovieHeadJaw } from "./IAutoMovieHeadJaw";
import { IAutoMovieHeadMouth } from "./IAutoMovieHeadMouth";
import { IAutoMovieHeadNose } from "./IAutoMovieHeadNose";
import { IAutoMovieHeadShape } from "./IAutoMovieHeadShape";

/**
 * A coarse full-head trait vector for authored morph templates. The engine's
 * `flattenHead` projects its leaves onto {@link AutoMovieHeadParameterName}
 * weights; the asset author supplies the neutral geometry and target deltas.
 * This retained vocabulary is independent of the numerical face documents in
 * `@automovie/human`.
 *
 * Anatomy-grouped so an LLM reads it the way a person reads a face; every leaf
 * is a signed weight in `[-2, 2]` (`0` = the unchanged template). Omitted fields
 * and groups mean neutral. The template determines the visible meaning of
 * each weight; expression is a separate contract.
 *
 * No engine validator range-checks a head document and no engine function
 * applies the flattened weights to geometry, so a caller supplying the template
 * also owns checking the documented range.
 *
 * @evidence contracts/common.md#principled-implementation Seven optional groups of signed leaves that `flattenHead` projects through a per-group field-to-name table into a partial weight map, skipping omitted groups and fields so the result carries only the traits the document set.
 * @evidence contracts/common.md#clear-and-simple-design Grouped by anatomy for the reader while the flat names stay in `AutoMovieHeadParameterName`; it is a retained compatibility contract kept apart from `IAutoMovieFace` and from the human package's numerical face documents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Limitation: the documented `[-2, 2]` range has no enforcer for heads and nothing in the repository applies the flattened weights, so out-of-range magnitudes reach a caller's template unchecked.
 * @evidence contracts/common.md#meaningful-documentation States the leaf range and neutral meaning, that omission means neutral, that the template decides each weight's visible effect, that expression is separate, and that range checking falls to the caller.
 * @author Samchon
 */
export interface IAutoMovieHead {
  /** Cranium and overall proportion. */
  shape?: IAutoMovieHeadShape;

  /** Eyebrows. */
  brow?: IAutoMovieHeadBrow;

  /** Eyes (incl. epicanthus / eyelid fold). */
  eyes?: IAutoMovieHeadEyes;

  /** Nose (incl. bridge height). */
  nose?: IAutoMovieHeadNose;

  /** Mouth and lips. */
  mouth?: IAutoMovieHeadMouth;

  /** Cheeks and cheekbones. */
  cheek?: IAutoMovieHeadCheek;

  /** Jaw and chin. */
  jaw?: IAutoMovieHeadJaw;
}
