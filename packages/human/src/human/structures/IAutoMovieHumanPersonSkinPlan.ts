import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanPersonHeadSkin } from "./IAutoMovieHumanPersonHeadSkin";
import type { IAutoMovieHumanPersonSkinBand } from "./IAutoMovieHumanPersonSkinBand";

/**
 * What forming a one-skin person's posed skin reads that does not depend on the document, compiled once from the generation.
 *
 * @evidence contracts/common.md#principled-implementation Compiled shared source indices and rest rows join head and body evaluation under one weight map and parent-before-child joint order.
 * @evidence contracts/common.md#clear-and-simple-design Generation-invariant neutral coordinates, correspondence maps and optional band stay separate from each document's evaluated skin frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shared sample mappings come from the generation rather than geometric registration between independently sourced skins.
 * @evidence contracts/common.md#meaningful-documentation Members document shared ordering, body-of-face lookup, rest rows, head weights, joint order and absent-band meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The generation-invariant shared-skin compilation records are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the generation-invariant shared-skin compilation records; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring generation-invariant shared-skin compilation records acquires no handles or running tasks; the object owner controls ordinary data lifetime.
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
