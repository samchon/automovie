import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";
import { IAutoMovieFaceBrowSet } from "./IAutoMovieFaceBrowSet";
import { IAutoMovieFaceCheekSet } from "./IAutoMovieFaceCheekSet";
import { IAutoMovieFaceEyeSet } from "./IAutoMovieFaceEyeSet";
import { IAutoMovieFaceJaw } from "./IAutoMovieFaceJaw";
import { IAutoMovieFaceMouth } from "./IAutoMovieFaceMouth";
import { IAutoMovieFaceNose } from "./IAutoMovieFaceNose";

/**
 * A portable facial trait vector for authored morph templates. This retained
 * engine vocabulary is independent of the anatomical face documents in
 * `@automovie/human`.
 *
 * The document mirrors facial anatomy: overall head form at the top level, then
 * one named group per feature ({@link IAutoMovieFaceEyeSet eyes},
 * {@link IAutoMovieFaceNose nose}, {@link IAutoMovieFaceJaw jaw}…), each group an
 * interface of its own so an LLM reads the schema the way a person reads a
 * face. Every leaf is a signed morph weight in `[-2, 2]` over the caller's
 * face template: `0` is the template unchanged, the sign picks the direction,
 * `±1` is one nameable trait step, and beyond `±1` exaggerates toward
 * caricature. **Omitted fields and groups mean neutral**: emit only the traits
 * you intend to change. Magnitudes are enforced at runtime by the engine
 * validator; each leaf projects onto one named morph target
 * ({@link AutoMovieFaceParameterName}). The asset author supplies the neutral
 * geometry and corresponding target deltas.
 *
 * Identity (whose face this is) and skin texture are asset concerns living in
 * the template, not here: this document stays a pure, portable trait vector, so
 * the same edit ("rounder cheeks, narrower jaw") applies to any character.
 *
 * @evidence contracts/common.md#principled-implementation Optional nested groups of signed weights that `flattenFace` walks in a fixed table order, emitting only present leaves, so `validateFace` paths and `morphFace` targets come from one mapping and an omitted field leaves the template unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One interface per facial feature so a tool-calling model reads the schema region by region, while likeness and skin stay in the template and motion stays in `IAutoMovieExpression`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Paired features follow the documented side rule and the eye pair adds `eyes.spacing` to each side's offset; both are contract rules applied once in `flattenFace`, not branches for particular callers.
 * @evidence contracts/common.md#meaningful-documentation States the signed range and the meaning of zero, one and beyond, that omission means neutral, which validator enforces magnitudes, which morph vocabulary each leaf projects onto, and what belongs to the template instead.
 * @author Samchon
 */
export interface IAutoMovieFace {
  /** Lateral width of the whole face: `+` wider, `-` narrower. */
  width?: AutoMovieFaceWeight;

  /**
   * Vertical stretch about the eye line: `+` longer (lower jaw drops, brow
   * rises), `-` shorter and rounder; childlike faces sit negative.
   */
  length?: AutoMovieFaceWeight;

  /**
   * The cheeks (left/right asymmetry inside). See
   * {@link IAutoMovieFaceCheekSet}.
   */
  cheeks?: IAutoMovieFaceCheekSet;

  /**
   * The jaw, with the chin nested at its tip. See {@link IAutoMovieFaceJaw}.
   */
  jaw?: IAutoMovieFaceJaw;

  /**
   * The eyes, shared fields + left/right asymmetry. See
   * {@link IAutoMovieFaceEyeSet}.
   */
  eyes?: IAutoMovieFaceEyeSet;

  /**
   * The eyebrows (left/right asymmetry inside). See
   * {@link IAutoMovieFaceBrowSet}.
   */
  brows?: IAutoMovieFaceBrowSet;

  /** The nose. See {@link IAutoMovieFaceNose}. */
  nose?: IAutoMovieFaceNose;

  /**
   * The mouth, with the lips nested inside. See {@link IAutoMovieFaceMouth}.
   */
  mouth?: IAutoMovieFaceMouth;
}
