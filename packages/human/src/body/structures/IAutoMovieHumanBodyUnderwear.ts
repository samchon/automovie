import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * The plain default underwear a body document may wear.
 *
 * It is not cloth: the builder cuts the posed skin's own triangles inside
 * the garment's regions and lifts them a few millimetres along the posed
 * normals, so the underwear follows every shape and pose the skin does. The
 * regions are rules on the body's landmarks, never vertex lists for one
 * person (`HUMAN_BODY_UNDERWEAR`).
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-underwear Names the two plain underwear styles a document can put on the body and its optional colour.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-underwear Types the document field whose style picks the regions the builder cuts.
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
  color?: { r: number; g: number; b: number };
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
    color: { r: number; g: number; b: number };

    /** Fabric roughness in [0,1]. */
    roughness: number;

    /** Lift of the fabric off the skin along the posed normal, metres. */
    offsetMetres: number;

    /**
     * Bones whose skin is never covered, with every bone below them: a
     * vertex is outside once half its skin weight is theirs.
     */
    uncovered: AutoMovieHumanoidBone[];

    /** Landmark ids the rules are measured on. */
    landmarks: {
      pelvis: string;
      lumbar: string;
      lowerChest: string;
      clavicle: string;
      shoulder: string;
      hips: { left: string; right: string };
      knees: { left: string; right: string };
    };

    /** The briefs of each style. */
    briefs: Record<
      IAutoMovieHumanBodyUnderwear["style"],
      {
        /** Waistband height, a fraction from the pelvis up to the lumbar landmark. */
        waist: number;
        /**
         * Leg line at the crotch, a fraction of the thigh's hip-to-knee
         * length below the hip joints' mean height.
         */
        crotch: number;
        /** Leg line at the outer hip in front, the same fraction (negative is above the hip joints). */
        front: number;
        /** Leg line at the outer hip behind, the same fraction. */
        back: number;
        /** Half width of the gusset, where the line leaves the crotch, a fraction of the hip joints' half distance from the midline. */
        gusset: number;
        /** Distance from the midline where the line reaches the outer hip, the same fraction. */
        outer: number;
      }
    >;

    /** The sports bra of `bra-and-briefs`. */
    bra: {
      /** The nipple, a vertex of one surface: the skin landmark the band is placed on. */
      nipple: { surface: number; vertex: number };
      /** Lower edge, a fraction from the nipple down to the lower-chest landmark. */
      bottom: number;
      /** Upper edge in front, a fraction from the nipple up to the clavicle landmark. */
      front: number;
      /** Upper edge at the back, the same fraction; the edge blends to it over the chest's depth. */
      back: number;
      /** Strap centre, a fraction from the clavicle out to the shoulder landmark. */
      strap: number;
      /** Strap half width, the same fraction. */
      strapHalfWidth: number;
    };
  }
}
