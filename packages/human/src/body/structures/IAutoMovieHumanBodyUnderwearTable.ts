import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyLinearRgb } from "./IAutoMovieHumanBodyLinearRgb";
import type { IAutoMovieHumanBodyUnderwear } from "./IAutoMovieHumanBodyUnderwear";
import type { IAutoMovieHumanBodyUnderwearBra } from "./IAutoMovieHumanBodyUnderwearBra";
import type { IAutoMovieHumanBodyUnderwearBriefs } from "./IAutoMovieHumanBodyUnderwearBriefs";
import type { IAutoMovieHumanBodyUnderwearLandmarks } from "./IAutoMovieHumanBodyUnderwearLandmarks";

/**
 * The rules the underwear's regions are cut by, in the basis frame (metres,
 * +Y up, +Z front, +X the body's left). Every height and width is a
 * fraction along a segment between two shaped landmarks, so a region
 * scales and moves with the body it is read on.
 *
 * @evidence contracts/common.md#principled-implementation Fractional landmark rules place garments in the shared metre-valued basis frame; material and normal offset govern final fabric composition.
 * @evidence contracts/common.md#clear-and-simple-design The table separates coverage dimensions, uncovered bones and material policy from the document's style choice.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coverage fractions are authored rendering conventions rather than garment-standard measurements or copied person vertex lists.
 * @evidence contracts/common.md#meaningful-documentation Members document material identity, units, landmark bindings and each style's rules.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The landmark garment rule table is a schema and selects no executable traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The landmark garment rule table defines no cache or request-level reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The landmark garment rule table declares no runtime resource owner.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwearTable {
  /** Material id of the garment part; it must not be a basis material. */
  material: string;

  /** Default linear RGB of the fabric. */
  color: IAutoMovieHumanBodyLinearRgb;

  /** Fabric roughness in [0,1]. */
  roughness: number;

  /** Signed normal lift from the final posed skin, metres. */
  offsetMetres: number;

  /**
   * Bones whose skin is never covered, with every bone below them: a
   * vertex is outside once half its skin weight is theirs.
   */
  uncovered: AutoMovieHumanoidBone[];

  /** Landmark ids the rules are measured on. */
  landmarks: IAutoMovieHumanBodyUnderwearLandmarks;

  /** The briefs of each style. */
  briefs: Record<
    IAutoMovieHumanBodyUnderwear["style"],
    IAutoMovieHumanBodyUnderwearBriefs
  >;

  /** The sports bra of `bra-and-briefs`. */
  bra: IAutoMovieHumanBodyUnderwearBra;
}
