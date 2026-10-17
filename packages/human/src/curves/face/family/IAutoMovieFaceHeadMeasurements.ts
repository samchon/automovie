import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import type { IAutoMovieFaceMeasurements as M } from "./IAutoMovieFaceMeasurements";

/** Dimensioned head and upper-neck fields in the native subject-left/up/front chart. The family owns the jaw floor and publishes its simple mid-neck tube separately.
 *
 * @author Samchon
 */
export namespace IAutoMovieFaceHeadMeasurements {
  /** Twelve angular supports ordered from anterior midline through subject-left, posterior midline and subject-right. Each lane supplies a Bernstein knot and outgoing angular handle. */
  export type Lane =
    | "centralFront"
    | "frontWingLeft"
    | "cheekLeft"
    | "sideLeft"
    | "posteriorQuarterLeft"
    | "posteriorWingLeft"
    | "centralBack"
    | "posteriorWingRight"
    | "posteriorQuarterRight"
    | "sideRight"
    | "cheekRight"
    | "frontWingRight";

  /** Named descending head sections. The factory requires strictly ordered physical Y heights; these labels do not select stored specimen coordinates. */
  export type Station =
    | "upperCrown"
    | "upperVault"
    | "cranialBreadth"
    | "temple"
    | "zygomaticBand"
    | "upperMouthBand"
    | "mandibleBand"
    | "chinProminence";

  /** Second-order Taylor data in longitudinal neck offset h, in mm: value + slope*h + curvature*h*h/2. Units follow the represented quantity and its first two derivatives.
   *
   * @author Samchon
   */
  export interface Polynomial<T> {
    /** Quantity at the mid-neck plane h=0; mm for position/radius and the corresponding component unit for other fields. */
    value: T;

    /** First derivative with respect to longitudinal mm at h=0; position and radius derivatives have units mm/mm. */
    slope: T;

    /** Second derivative with respect to longitudinal mm; the evaluator applies the Taylor factor 1/2, so this is not the h-squared coefficient. */
    curvature: T;
  }

  /** Quadratic family of four-span neck sections. Evaluating at h=0 supplies the shared mid-tube P and full transverse derivative J.
   *
   * @author Samchon
   */
  export interface Neck {
    /** Taylor fields evaluated together before converting cardinal knots and tangent offsets into cubic controls. */
    coefficients: {
      /** Native center position, mm, and its derivatives with respect to longitudinal mm. */
      center: Polynomial<C.Vector>;

      /** Subject-left/right semiaxis, mm; its derivatives change the entire transverse control field, not only the cardinal points. */
      halfWidth: Polynomial<number>;

      /** Anterior/posterior semiaxis, mm, with longitudinal first and second derivatives. */
      halfDepth: Polynomial<number>;

      /** Additional mm offsets at front X, left Z, back X and right Z, in that order; derivative tuples use the same ordering. */
      cardinalOffset: Polynomial<readonly [number, number, number, number]>;
    };
  }

  /** One dimensionless head support section relative to the declared head origin, chin plane and physical dimensions. It seeds the continuous longitudinal fields.
   *
   * @author Samchon
   */
  export interface Section {
    /** Native Y is chinHeight + heightRatio*headHeight; ascending labels must still yield descending physical stations. */
    heightRatio: number;

    /** Full transverse cranial support width divided by cranialBreadth. Lower anterior supports are reconciled to the actual jaw course at named stations before interpolation, so this does not impose a closed lower-skull width. */
    widthRatio: number;

    /** Optional anterior cheek-lane half-width divided by the section half-width. At the temple this locates the actual frontotemporale chord independently of the cranial side pole. Omission retains the common 0.68 angular support convention. */
    anteriorChordRatio?: number;

    /** Transverse section-center displacement divided by cranialBreadth, relative to frame.localOrigin.X. */
    centerXRatio: number;

    /** Anterior Z displacement from frame.localOrigin divided by headDepth. */
    frontDepthRatio: number;

    /** Posterior Z displacement from frame.localOrigin divided by headDepth; front minus back must be positive. */
    backDepthRatio: number;

    /** Per-lane dimensionless interpolation between section back (0) and front (1). The central-front feature profile can override its interpolated Z. */
    depthCoefficients: Record<Lane, number>;
  }

  /** Dimensioned mandibular support course from chin through parasymphysis, body, angle and ramus. These are geometric support proxies, not a fitted mandible surface.
   *
   * @author Samchon
   */
  export interface JawSide {
    /** Magnitude of the angle X coordinate relative to the chin, mm; anatomical side determines its sign. */
    angleHalfWidthMm: number;

    /** Angle height above the inferior chin, mm; body and parasymphysis rises use this as their scale. */
    angleRiseMm: number;

    /** Positive posterior distance from inferior chin to angle, mm; applied in negative native Z. */
    angleRecessionMm: number;

    /** Parasymphysis X magnitude divided by angleHalfWidthMm. */
    parasymphysisWidthRatio: number;

    /** Parasymphysis rise divided by angleRiseMm. */
    parasymphysisRiseRatio: number;

    /** Parasymphysis posterior displacement divided by angleRecessionMm. */
    parasymphysisRecessionRatio: number;

    /** Mandibular-body X magnitude divided by angleHalfWidthMm. */
    bodyWidthRatio: number;

    /** Mandibular-body rise divided by angleRiseMm. */
    bodyRiseRatio: number;

    /** Mandibular-body posterior displacement divided by angleRecessionMm. */
    bodyRecessionRatio: number;

    /** Ramus support X magnitude divided by angleHalfWidthMm. */
    ramusWidthRatio: number;

    /** Additional superior displacement of the ramus support from the angle, mm. */
    ramusRiseAboveAngleMm: number;

    /** Additional posterior displacement of the ramus support from the angle, mm. */
    ramusRecessionBeyondAngleMm: number;
  }

  /** Head and upper-neck construction inputs in one native physical-Y chart. Closed supports define curves only; they do not fill facial apertures or certify a skin limit.
   *
   * @author Samchon
   */
  export interface Head {
    /** Native head reference for reconstructing normalized X/Z displacements; vertical normalization uses dimensions.chinHeight instead. */
    frame: {
      /** Native mm head reference. Its X/Z components offset normalized head supports; section Y is measured from chinHeight. */
      localOrigin: C.Vector;
    };

    /** Physical scales used to recover native coordinates from dimensionless head courses. */
    dimensions: {
      /** Vertical normalization scale, mm, for crown, chin and named station positions. */
      headHeight: number;

      /** Full transverse normalization scale, mm; this is not an angular arc length. */
      cranialBreadth: number;

      /** Anterior/posterior normalization scale, mm; using it as a section depth is a caller convention rather than a clinical endpoint guarantee. */
      headDepth: number;

      /** Absolute native Y of the inferior chin plane, mm. */
      chinHeight: number;

      /** Positive longitudinal mm from mid-tube to upper tube. The quadratic collar spans this interval. */
      upperNeckOffset: number;
    };

    /** Crown point in units of cranialBreadth, headHeight and headDepth, relative to the head X/Z reference and chin Y plane. */
    crownNormalized: C.Vector;

    /** Inferior chin support in the same normalized chart as crownNormalized. */
    inferiorChinNormalized: C.Vector;

    /** Anterior chin prominence in the normalized chart; it lies between inferior chin and sublabial support in physical Y. */
    chinProminenceNormalized: C.Vector;

    /** Sublabial support in the normalized chart; the sagittal bridge connects it to the actual lower-lip endpoint. */
    sublabialNormalized: C.Vector;

    /** Named descending supports from upper crown to chin prominence. Below the jaw-angle plane the delivered section is an open anterior course ending on the actual jaw-floor guide; it has no invented posterior skull closure. */
    sections: Record<Station, Section>;

    /** Actual mid/upper tube polynomial field. Its P and first derivative supply the shared neck operator. */
    neckFamily: Neck;

    /** Bilateral jaw supports and the common handle-length convention for their open inferior course. */
    jaw: {
      /** Independent left and right dimensioned jaw records in the subject frame. */
      sides: Record<M.Side, JawSide>;

      /** Neighbor-chord fraction used as a cubic handle offset by FaceMath.curve; it is a geometric rounding choice, not an anatomical constant. */
      roundingRatio: number;
    };
  }
}
