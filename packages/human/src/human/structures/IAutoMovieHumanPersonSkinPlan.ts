import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanPersonHeadSkin } from "./IAutoMovieHumanPersonHeadSkin";
import type { IAutoMovieHumanPersonSkinBand } from "./IAutoMovieHumanPersonSkinBand";

/**
 * What forming a one-skin person's posed skin reads that does not depend on
 * the document, compiled once from the generation.
 *
 * @evidence contracts/common.md#principled-implementation The shared-sample maps, neutral positions and weight maps are compiled once per generation.
 * @evidence contracts/common.md#clear-and-simple-design One record of the tables the forming step reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every table is derived from the generation's own registration; nothing is matched by position.
 * @evidence contracts/common.md#meaningful-documentation States what each table holds.
 * @evidence contracts/modeling.md#shared-boundaries Holds the shared-sample correspondence both halves read one value through.
 * @evidence contracts/modeling.md#spatial-conventions Neutral positions are metres of the generation's frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The plan defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The plan carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The plan emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The plan is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The plan carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The plan admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The plan converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSkinPlan {
  /** The head skin's vertex count. */
  faceCount: number;

  /** The head skin's neutral positions. */
  faceNeutral: readonly number[];

  /** Per head skin region id, the skin vertex each render vertex reads. */
  faceRegions: ReadonlyMap<string, readonly number[]>;

  /** The body skin's neutral positions. */
  bodyNeutral: readonly number[];

  /** Shared body vertices, in shared order. */
  sharedBody: readonly number[];

  /** Shared head vertices, in the same order. */
  sharedFace: readonly number[];

  /** Each shared head vertex's body vertex. */
  bodyOfFace: ReadonlyMap<number, number>;

  /** Each body vertex the rest table holds (shared, then band) by its row. */
  restRows: ReadonlyMap<number, number>;

  /** The generation's one weight map over the head skin. */
  headSkin: IAutoMovieHumanPersonHeadSkin;

  /** The body's joints, parent before child. */
  joints: IAutoMovieHumanBodyBasis["joints"];

  /** The band's body side, when the generation has band rows. */
  band?: IAutoMovieHumanPersonSkinBand;
}
