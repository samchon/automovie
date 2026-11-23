/** Data and callback contracts shared by the PolarSector operations. */
export namespace IAutoMoviePolarSector {
  /** A guide: a fixed angle owning the radius and its two angle derivatives. */
  export interface IGuide {
    /** Polar angle, radians. */
    angle: number;

    /** Radius. */
    value: number;

    /** First derivative of the radius in the angle. */
    slope: number;

    /** Second derivative of the radius in the angle. */
    curvature: number;
  }

  /**
   * Radius and its first/second angular derivatives, in radius units per radian
   * order.
   */
  export type Jet = [number, number, number];
}
