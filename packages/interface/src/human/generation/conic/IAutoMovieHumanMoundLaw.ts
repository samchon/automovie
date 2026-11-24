/**
 * Public contracts for native mound geometry.
 */
export namespace IAutoMovieHumanMoundLaw {
  /**
   * A mound's base radii from the apex's foot on the chest wall, mm.
   */
  export interface IRadii {
    /** Toward the median plane. */
    medial: number;

    /** Toward the side. */
    lateral: number;

    /** Down to the fold under the breast. */
    inferior: number;
  }

  /**
   * A mound: its base and how far its apex stands off the chest wall.
   */
  export interface IMound {
    /** The base's radii, mm. */
    radii: IRadii;

    /** The projection, mm. */
    projection: number;
  }
}
