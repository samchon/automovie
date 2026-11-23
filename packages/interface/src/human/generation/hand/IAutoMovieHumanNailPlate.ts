/**
 * Nail dimensions and a dorsal-skin placement frame in millimetres.
 *
 * The interface package owns these declarations; AutoMovieHumanNailPlate in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanNailPlate {
  /** A plate's derived dimensions, mm. */
  export interface ISize {
    /** Length root to free edge. */
    length: number;

    /** Width edge to edge. */
    width: number;

    /** Transverse rise. */
    sag: number;

    /** Free-edge lift. */
    lift: number;
  }

  /** A plate's fixed inputs. */
  export interface IInput {
    /** The centre of the plate's root on the dorsal skin, mm. */
    origin: [number, number, number];

    /** Unit direction of the nail bed. */
    along: [number, number, number];

    /** Unit dorsal normal of the skin at the root. */
    normal: [number, number, number];

    /** Length of the distal phalanx, mm. */
    phalanx: number;

    /** Full width of the section at the plate's root, mm. */
    width: number;
  }
}
