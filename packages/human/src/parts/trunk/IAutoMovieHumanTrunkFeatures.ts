/**
 * The trunk's feature curves: where each runs and how it shapes the surface.
 *
 * Every curve carries the distance it moves the surface along its radius at full weight, outward positive, and the half-width of the band over which that fades, both millimetres. Placement shares are of the named span.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanTrunkFeatures {
  /** The clavicle, from clavicale to the acromion. */
  clavicle: IAutoMovieHumanTrunkFeatures.ICurve;

  /** The inferior border of the pectoralis major, from the sternum at the inframammary fold to the anterior axillary fold. */
  pectoral: IAutoMovieHumanTrunkFeatures.IPectoral;

  /** The iliac crest, from the anterior superior iliac spine over iliocristale to the posterior superior iliac spine. */
  iliac: IAutoMovieHumanTrunkFeatures.IIliac;

  /** The inguinal line, from the anterior superior iliac spine to the pubic tubercle. */
  inguinal: IAutoMovieHumanTrunkFeatures.IInguinal;

  /** The natal cleft, down the back's midline from the sacrum's apex to the crotch. */
  cleft: IAutoMovieHumanTrunkFeatures.ICleft;
}
export namespace IAutoMovieHumanTrunkFeatures {
  /**
   * How one curve shapes the surface.
   *
   * @author Samchon
   */
  export interface ICurve {
    /** Movement of the surface along its radius on the curve, millimetres, outward positive. */
    offset: number;

    /** Half-width of the band the movement fades over, millimetres, positive. */
    width: number;
  }

  /**
   * The inferior pectoral border.
   *
   * @author Samchon
   */
  export interface IPectoral extends ICurve {
    /** Distance of its medial end from the midline at the inframammary fold, millimetres. */
    medial: number;

    /** Its middle point across, as a share of the half breadth at the inframammary fold. */
    middle: number;

    /** Its lateral end across, as a share of the half breadth at the axilla. */
    lateral: number;

    /** Depth of its lateral end below the axilla, millimetres. */
    below: number;
  }

  /**
   * The iliac crest.
   *
   * @author Samchon
   */
  export interface IIliac extends ICurve {
    /** Distance of the posterior superior iliac spine from the midline, millimetres. */
    dimple: number;
  }

  /**
   * The inguinal line.
   *
   * @author Samchon
   */
  export interface IInguinal extends ICurve {
    /** Height of the pubic tubercle as a share of the way from the crotch up to the anterior superior iliac spine. */
    tubercle: number;

    /** Distance of the pubic tubercle from the midline, millimetres. */
    medial: number;
  }

  /**
   * The natal cleft.
   *
   * @author Samchon
   */
  export interface ICleft extends ICurve {
    /** Height of the sacrum's apex as a share of the way from the buttock level up to the anterior superior iliac spine. */
    apex: number;
  }
}
