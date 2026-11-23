import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * The anatomical bust-point position and increasing-phase trunk tangent
 * defining a breast frame. Runtime construction and admission remain with
 * AutoMovieHumanBreastFrame in Human.
 */
export namespace IAutoMovieHumanBreastFrame {
  /** What the frame reads. */
  export interface IInput {
    /**
     * The bust point on the wall, `[x, y, z]`, mm (ISO 8559-1 3.1.11, a bare
     * breast's most anterior point).
     */
    apex: AutoMovieVector3Tuple;

    /**
     * The wall's section tangent at the apex in `[x, z]`, in the direction of
     * rising phase (front: z rising).
     */
    tangent: [number, number];
  }
}
