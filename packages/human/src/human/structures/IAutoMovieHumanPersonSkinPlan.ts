import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanPersonHeadSkin } from "./IAutoMovieHumanPersonHeadSkin";
import type { IAutoMovieHumanPersonSkinBand } from "./IAutoMovieHumanPersonSkinBand";

/**
 * What forming a one-skin person's posed skin reads that does not depend on
 * the document, compiled once from the generation.
 *
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
