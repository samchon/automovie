import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyLinearRgb } from "./IAutoMovieHumanBodyLinearRgb";
import type { IAutoMovieHumanBodyUnderwearBra } from "./IAutoMovieHumanBodyUnderwearBra";
import type { IAutoMovieHumanBodyUnderwearBriefs } from "./IAutoMovieHumanBodyUnderwearBriefs";
import type { IAutoMovieHumanBodyUnderwearLandmarks } from "./IAutoMovieHumanBodyUnderwearLandmarks";

/**
 * The plain default underwear a body document may wear.
 *
 * It is not cloth: the builder cuts the posed skin's own triangles inside
 * the garment's regions and lifts them a few millimetres along the posed
 * normals, so the underwear follows every shape and pose the skin does. The
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

    /** Lift of the fabric off the skin along the posed normal, metres. */
    offsetMetres: number;

    /**
     * Width of the widest skin crease the fabric bridges instead of following
     * it down, metres (twice the radius of the ball the fabric cannot bend
     * tighter than); zero lays the fabric on the skin everywhere. Creases
     * narrower than three fifths of it are always bridged, wider ones
     * never are, and wider concavities keep their depth.
     */
    spanMetres: number;

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
