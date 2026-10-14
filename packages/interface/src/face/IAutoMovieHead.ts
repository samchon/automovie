import { IAutoMovieHeadBrow } from "./IAutoMovieHeadBrow";
import { IAutoMovieHeadCheek } from "./IAutoMovieHeadCheek";
import { IAutoMovieHeadEyes } from "./IAutoMovieHeadEyes";
import { IAutoMovieHeadJaw } from "./IAutoMovieHeadJaw";
import { IAutoMovieHeadMouth } from "./IAutoMovieHeadMouth";
import { IAutoMovieHeadNose } from "./IAutoMovieHeadNose";
import { IAutoMovieHeadShape } from "./IAutoMovieHeadShape";

/**
 * A coarse full-head trait vector for an authored morph template, independent
 * of the anatomical face documents in `@automovie/human`.
 *
 * The groups follow anatomy so a model reads the schema the way a person reads
 * a head. Every leaf is a signed weight in `[-2, 2]` with `0` meaning the
 * unchanged template, and omitted fields and groups mean neutral. The engine's
 * `flattenHead` renames each leaf to one {@link AutoMovieHeadParameterName}
 * and copies its value unchanged; the template author supplies the neutral
 * geometry and one target per name, so the template decides the visible effect
 * of each weight. Expression is a separate contract.
 *
 * This is retained dormant schema: `flattenHead` has no production caller, no
 * engine validator range-checks a head document, and no engine function applies
 * the flattened weights to geometry. A caller supplying a template therefore
 * also owns checking the documented range.
 *
 * @evidence contracts/common.md#principled-implementation Linear morph weights over an author-supplied template, renamed one-to-one by `flattenHead` from a table whose mapped type requires every group and leaf of this interface, so the head vocabulary and the document cannot drift apart.
 * @evidence contracts/common.md#clear-and-simple-design Seven optional anatomy groups make the neutral head the empty object; unlike `IAutoMovieFace`, the head is unsided, so each group is a flat record with no left and right sets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ranges are documented rather than encoded as type tags, and the missing range check and missing application are stated as remaining gaps instead of being implied by the projection.
 * @evidence contracts/common.md#meaningful-documentation States the independence from the human package, the leaf range and neutral meaning, the projection and who supplies the targets, that expression is separate, and that no engine path validates or applies the weights; members name each group's scope.
 * @author Samchon
 */
export interface IAutoMovieHead {
  /** Cranium and overall proportion. */
  shape?: IAutoMovieHeadShape;

  /** Eyebrows, both moved together. */
  brow?: IAutoMovieHeadBrow;

  /** Eyes, including the epicanthic and upper-lid folds. */
  eyes?: IAutoMovieHeadEyes;

  /** Nose, including the bridge height. */
  nose?: IAutoMovieHeadNose;

  /** Mouth and lips, including a resting corner lift. */
  mouth?: IAutoMovieHeadMouth;

  /** Cheeks and cheekbones. */
  cheek?: IAutoMovieHeadCheek;

  /** Jaw and chin, with the chin's leaves flattened into this group. */
  jaw?: IAutoMovieHeadJaw;
}
