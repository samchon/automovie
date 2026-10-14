import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IPortraitHairShape } from "../anatomy/hair/IPortraitHairShape";
import type { IAutoMovieHumanFaceGroomCard } from "./IAutoMovieHumanFaceGroomCard";

/**
 * A complete groom expressed against one facial basis, plus its finish.
 *
 * This legacy surface-seated resource retains authored lock guides rather than the named population fields of the numerical hair document. Its profile supplies the same taper, fibre and curl controls to the procedural card tessellator, and its independently supplied finish participates in the resident palette. The seat resolver checks named parts, triangle ordinals and noncollapsed frames; it does not compare this declared basis identity with the supplied model or prove collision-free placement.
 *
 * @evidence contracts/common.md#principled-implementation Legacy per-lock triangle-local seats ride the supplied live face, with metre guides converted for the common millimetre card tessellator and an independently named finish composed afterward.
 * @evidence contracts/common.md#clear-and-simple-design Groom/resource identity, declared basis, finish, non-card profile and card list remain separate from the numerical named hair-population document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This legacy guide-bearing representation is not a named biological input. Current consumers check actual seat support but do not enforce its basis metadata or certify collision/likeness; those limitations are not hidden behind successful composition.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies legacy authoring and actual/missing checks; members state declared source identity, finish/profile ownership and the 1024-card allocation envelope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This resource schema runs no seat resolution or card tessellation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Basis metadata and authored guides define inputs, not geometry equivalence or cached live-seat evaluation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The resource caller owns guide/card arrays and finish; the tessellator bounds allocation and this type opens no asset/renderer handle.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceGroom {
  /** Stable identity of this authored groom. */
  id: string;

  /** Identity of the facial basis whose surfaces the seats name. */
  basis: string;

  /** Base finish the generated card material derives from. */
  finish: IAutoMovieMaterial;

  /** Every authored control a procedural groom carries except the locks. */
  profile: Omit<IPortraitHairShape, "cards" | "material">;

  /** Zero through 1024 surface-seated locks. */
  cards: readonly IAutoMovieHumanFaceGroomCard[];
}
