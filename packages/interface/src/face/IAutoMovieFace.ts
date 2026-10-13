import { IAutoMovieFaceBrowSet } from "./IAutoMovieFaceBrowSet";
import { IAutoMovieFaceCheekSet } from "./IAutoMovieFaceCheekSet";
import { IAutoMovieFaceEyeSet } from "./IAutoMovieFaceEyeSet";
import { IAutoMovieFaceJaw } from "./IAutoMovieFaceJaw";
import { IAutoMovieFaceMouth } from "./IAutoMovieFaceMouth";
import { IAutoMovieFaceNose } from "./IAutoMovieFaceNose";

/**
 * A portable facial trait vector for an authored morph template, independent
 * of the anatomical face documents in `@automovie/human`.
 *
 * The document mirrors facial anatomy: overall face form at the top level, then
 * one named group per feature, so a model reads the schema the way a person
 * reads a face. Every leaf is a signed morph weight in `[-2, 2]` over the
 * template: `0` leaves it unchanged, the sign picks the direction, `1` is one
 * nameable trait step, and values past `1` exaggerate toward caricature.
 * Omitted fields and groups mean neutral, so a document states only the traits
 * it changes.
 *
 * Each leaf projects onto one or two {@link AutoMovieFaceParameterName} targets
 * through the engine's `flattenFace`; `validateFace` reports any projected
 * weight outside `[-2, 2]` at the field the document spells, and `morphFace`
 * adds each weight times its target delta to the template. Identity and skin
 * are the template's concern, so one edit, such as rounder cheeks and a
 * narrower jaw, applies to any character.
 *
 * @evidence contracts/common.md#principled-implementation Linear blendshapes over a neutral template: `flattenFace` turns the nested document into `(parameter, path, weight)` triples, `validateFace` range-checks each triple at its path, and `morphFace` sums `weight * delta` per target, so validation and application read one mapping.
 * @evidence contracts/common.md#clear-and-simple-design Optional leaves grouped by feature make the neutral face the empty object and let a document carry only its edits, with paired features delegated to side-aware set types instead of duplicated left and right fields here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ranges stay in documentation and the engine validator rather than type tags, and an out-of-range weight is reported rather than clamped; no character, template or topology is assumed by the document.
 * @evidence contracts/common.md#meaningful-documentation States the independence from the human package, the leaf range and sign convention, the meaning of omission, the projection, validation and morph steps, and what stays with the template; members give each trait's direction.
 * @author Samchon
 */
export interface IAutoMovieFace {
  /** Lateral width of the whole face: `+` wider, `-` narrower. */
  width?: number;

  /**
   * Vertical stretch about the eye line: `+` longer, with the lower jaw dropping
   * and the brow rising, and `-` shorter and rounder, where childlike faces sit.
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
