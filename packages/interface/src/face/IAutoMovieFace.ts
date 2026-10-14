import { IAutoMovieFaceBrowSet } from "./IAutoMovieFaceBrowSet";
import { IAutoMovieFaceCheekSet } from "./IAutoMovieFaceCheekSet";
import { IAutoMovieFaceEyeSet } from "./IAutoMovieFaceEyeSet";
import { IAutoMovieFaceJaw } from "./IAutoMovieFaceJaw";
import { IAutoMovieFaceMouth } from "./IAutoMovieFaceMouth";
import { IAutoMovieFaceNose } from "./IAutoMovieFaceNose";

/**
 * A facial trait vector for a compatible authored morph template, independent of the anatomical face documents in `@automovie/human`.
 *
 * The document mirrors facial anatomy: overall face form at the top level, then one named group per feature. Projected weights must be finite and within `[-2, 2]`; `1` applies the authored target delta once, negative values reverse it, and magnitudes above `1` extrapolate. The template must author deltas with the member descriptions' intended directions; the engine does not inspect whether the geometry realizes those traits.
 *
 * Each leaf projects onto one or two {@link AutoMovieFaceParameterName} targets through `flattenFace`; `validateFace` checks the projected weight and `morphFace` adds its weighted delta. Omission skips a target, whereas an explicitly authored `0` still requires a matching, correctly sized target. With finite template data, zero contributes no displacement. Reusing an edit across characters requires compatible target names and trait meanings, and does not promise equal geometry or appearance.
 *
 * @evidence contracts/common.md#principled-implementation Linear blendshapes over a neutral template: `flattenFace` turns the nested document into `(parameter, path, weight)` triples, `validateFace` range-checks each triple at its path, and `morphFace` sums `weight * delta` per target, so validation and application read one mapping.
 * @evidence contracts/common.md#clear-and-simple-design Optional leaves grouped by feature make the neutral face the empty object and let a document carry only its edits, with paired features delegated to side-aware set types instead of duplicated left and right fields here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Validation reports nonfinite or out-of-range projected weights rather than clamping them; morphing requires matching target storage even for explicit zero, and neither step certifies the target's anatomical meaning or derived arithmetic finiteness.
 * @evidence contracts/common.md#meaningful-documentation States the human-package separation, projected range, authored-delta convention, omission versus zero, compatible-template premise and absence of an appearance guarantee; members name the intended trait directions.
 * @author Samchon
 */
export interface IAutoMovieFace {
  /** Lateral width of the whole face: `+` wider, `-` narrower. */
  width?: number;

  /**
   * Intended vertical stretch about the eye line: `+` longer, with the lower jaw dropping and the brow rising; `-` shorter and rounder.
   */
  length?: number;

  /** The cheeks, with optional left and right asymmetry. */
  cheeks?: IAutoMovieFaceCheekSet;

  /** The jaw, with the chin nested at its tip. */
  jaw?: IAutoMovieFaceJaw;

  /** The eyes: shared spacing plus optional left and right asymmetry. */
  eyes?: IAutoMovieFaceEyeSet;

  /** The eyebrows, with optional left and right asymmetry. */
  brows?: IAutoMovieFaceBrowSet;

  /** The nose. */
  nose?: IAutoMovieFaceNose;

  /** The mouth, with the lips nested inside. */
  mouth?: IAutoMovieFaceMouth;
}
