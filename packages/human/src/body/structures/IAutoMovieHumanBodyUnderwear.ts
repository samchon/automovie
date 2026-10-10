import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyLinearRgb } from "./IAutoMovieHumanBodyLinearRgb";
import type { IAutoMovieHumanBodyUnderwearBra } from "./IAutoMovieHumanBodyUnderwearBra";
import type { IAutoMovieHumanBodyUnderwearBriefs } from "./IAutoMovieHumanBodyUnderwearBriefs";
import type { IAutoMovieHumanBodyUnderwearLandmarks } from "./IAutoMovieHumanBodyUnderwearLandmarks";

/**
 * The plain default underwear a body document may wear.
 *
 * The builder partitions the final skin into complementary exposed-skin and
 * fabric material regions. This basic garment has zero geometric thickness;
 * it adds no normal offset, crease restoration or independent cloth surface.
 * Actual source topology, normals and final mesh admission remain applicable. The garment's
 * regions are rules on the body's joint landmarks and named skin points,
 * never vertex lists for one person or one basis (`HUMAN_BODY_UNDERWEAR`).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwear {
  /**
   * `boxer-briefs`: fitted shorts from below the navel to a third of the
   * way down the thigh. `bra-and-briefs`: a sports bra with shoulder straps
   * and briefs cut high over the hip.
   */
  style: "boxer-briefs" | "bra-and-briefs";

  /** Optional linear RGB, each channel in [0,1]; omission is the table's colour. */
  color?: IAutoMovieHumanBodyLinearRgb;
}
export namespace IAutoMovieHumanBodyUnderwear {
  /**
   * The rules the underwear's regions are cut by, in the basis frame (metres,
   * +Y up, +Z front, +X the body's left). Every height and width is a
   * fraction along a segment between two shaped landmarks, so a region
   * scales and moves with the body it is read on.
   */
  export interface ITable {
    /** Material id of the garment part; it must not be a basis material. */
    material: string;

    /** Default linear RGB of the fabric. */
    color: IAutoMovieHumanBodyLinearRgb;

    /** Fabric roughness in [0,1]. */
    roughness: number;

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
}
