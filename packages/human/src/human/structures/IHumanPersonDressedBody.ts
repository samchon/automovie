import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodyUnderwearParts } from "../../body/structures/IAutoMovieHumanBodyUnderwearParts";

/**
 * Body source parts retained until Person's final shared-skin material split. The internal recipe stays outside the public serializable Body build record.
 *
 * @evidence contracts/common.md#principled-implementation The dressed result retains original body geometry plus an optional rest-material recipe, postponing fabric construction until shared-skin placement finishes.
 * @evidence contracts/common.md#clear-and-simple-design An internal recipe accompanies the body without extending the serializable public body build with temporary garment authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing garments mean the document wears none; original geometry is retained rather than a pre-join fabric substitute.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish registered fabric material on the body from the optional rest coverage recipe.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This transport chooses no dressing algorithm; fabric registration and final material composition own their allocations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A retained recipe is an operand for later composition, not a cache of equivalent dressed bodies.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The containing person construction owns the optional recipe's lifetime; this type owns no file or renderer handle.
 *
 * @author Samchon
 */
export interface IHumanPersonDressedBody {
  /** Body record with its original source geometry and registered fabric material. */
  body: IAutoMovieHumanBodyBuild;

  /** Rest-material garment recipe; absent when the document wears none. */
  garment?: IAutoMovieHumanBodyUnderwearParts;
}
