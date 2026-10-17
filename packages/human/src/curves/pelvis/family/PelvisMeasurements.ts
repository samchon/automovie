/** Named native-chart inputs for the pelvis support family. These are semantic dimensions, support fractions and rounding coefficients, not a generated control network. Public identity resolution and the older native calibration pathway are separate callers; neither descriptive gate labels nor diagnostics select geometry.
 *
 * @author Samchon
 */
export namespace PelvisMeasurements {
  /** XYZ components in subject-left, up and front order; position values are millimetres and derivative units are declared by the containing field.
   */
  export type Vec = [number, number, number];

  /** Anatomical side in the native subject frame, independent of screen direction.
   */
  export type Side = "left" | "right";

  /** Translation gauge for all named physical stations; this record carries no implicit rotation or posture conversion.
   *
   * @author Samchon
   */
  export interface Frame {
    /** Native measurement-chart origin in millimetres, before parent placement; axes are subject-left X, up Y and front Z.
     */
    origin_mm: Vec;

    /** Signed X offset of the anterior and posterior median supports from the measurement origin, in millimetres.
     */
    medianLateralFromOrigin_mm: number;
  }

  /** V17 inner-front or outer-transition support rule in the anterior XZ section chart; fractions locate supports and dZ/dX directs their handles.
   *
   * @author Samchon
   */
  export interface FrontSupport {
    /** V17 inner-front X position as a dimensionless fraction from the median to the anterior lane; station construction requires it strictly between zero and the outer transition.
     */
    lateralFractionMedianToAnteriorLane?: number;

    /** V17 outer-transition X fraction from the inner-front support toward the anterior lane; the resulting support must lie strictly between them.
     */
    lateralFractionInnerToAnteriorLane?: number;

    /** Signed Z support position relative to the measurement origin, in millimetres; V17 reads this for the inner-front support.
     */
    frontOffsetFromFrame_mm?: number;

    /** Dimensionless dZ/dX of the V17 anterior tangent; multiplies the derived X handle rather than displacing a support.
     */
    depthSlope_dZ_dX: number;
  }

  /** One horizontal course of the merged body above the branch domain. X breadths and Z supports remain independent of the angular handle multipliers.
   *
   * @author Samchon
   */
  export interface MergedStation {
    /** Semantic course identifier used in emitted curve names and inspection; it does not select a calibration identity.
     */
    name: string;

    /** Horizontal course Y minus measurement-origin Y, in millimetres; longitudinal families require ascending absolute heights.
     */
    heightFromFrame_mm: number;

    /** Course center X minus measurement-origin X, in millimetres; positive is subject-left.
     */
    centerLateralFromFrame_mm: number;

    /** Distance from the course center to its subject-left lateral support, in millimetres.
     */
    leftHalfBreadth_mm: number;

    /** Distance from the course center to its subject-right lateral support, in millimetres.
     */
    rightHalfBreadth_mm: number;

    /** Left lateral support Z minus measurement-origin Z, in millimetres.
     */
    leftLateralFrontOffset_mm: number;

    /** Left anterior-lane support Z minus measurement-origin Z, in millimetres; fan construction supplies its X.
     */
    leftAnteriorFrontOffset_mm: number;

    /** Anterior median support Z minus measurement-origin Z, in millimetres.
     */
    medianFrontOffset_mm: number;

    /** Right anterior-lane support Z minus measurement-origin Z, in millimetres; fan construction supplies its X.
     */
    rightAnteriorFrontOffset_mm: number;

    /** Right lateral support Z minus measurement-origin Z, in millimetres.
     */
    rightLateralFrontOffset_mm: number;

    /** Right posterior-lane support Z minus measurement-origin Z, in millimetres.
     */
    rightPosteriorFrontOffset_mm: number;

    /** Posterior median support Z minus measurement-origin Z, in millimetres; it can represent a recess from the posterior lanes.
     */
    medianPosteriorFrontOffset_mm: number;

    /** Left posterior-lane support Z minus measurement-origin Z, in millimetres.
     */
    leftPosteriorFrontOffset_mm: number;

    /** Optional R6b per-side signed Z displacement, in millimetres, applied to each anterior arch junction and its two adjacent handles.
     */
    anteriorArchRecess_mm?: Record<Side, number>;

    /** V17 bilateral inner-front positions and tangent slopes; required by the sixteen-lane station constructor.
     */
    innerAnteriorSupport?: Record<Side, FrontSupport>;

    /** V17 bilateral outer-transition fractions and tangent slopes; required together with the inner-front supports.
     */
    outerAnteriorTransition?: Record<Side, FrontSupport>;
  }

  /** Four-cardinal horizontal thigh course, ordered outer, anterior, inner and posterior. Positive breadth and depth set its support envelope; phase offsets and fullness set shape without a saved control table.
   *
   * @author Samchon
   */
  export interface PairedStation {
    /** Semantic course identifier used in emitted curve names and inspection; it does not select a calibration identity.
     */
    name: string;

    /** Anatomical lateral sign: +1 for left and -1 for right; reflection is explicit in the support formula.
     */
    sideSign: number;

    /** Horizontal course Y minus measurement-origin Y, in millimetres; longitudinal families require ascending absolute heights.
     */
    heightFromFrame_mm: number;

    /** Course center X minus measurement-origin X, in millimetres; positive is subject-left.
     */
    centerLateralFromFrame_mm: number;

    /** Paired course center Z minus measurement-origin Z, in millimetres; positive is anterior.
     */
    centerFrontFromFrame_mm: number;

    /** Full paired-course lateral support separation in millimetres; paired construction rejects nonpositive values.
     */
    breadth_mm: number;

    /** Full paired-course anterior/posterior support separation in millimetres; paired construction rejects nonpositive values.
     */
    depth_mm: number;

    /** Outer cardinal Z offset divided by half depth, relative to the paired-course center.
     */
    outerDepthPhase: number;

    /** Inner cardinal Z offset divided by half depth, relative to the paired-course center.
     */
    innerDepthPhase: number;

    /** Anterior cardinal X offset divided by half breadth, relative to the paired-course center.
     */
    frontLateralPhase: number;

    /** Posterior cardinal X offset divided by half breadth, relative to the paired-course center.
     */
    backLateralPhase: number;

    /** Optional four cardinal handle multipliers used for both incoming and outgoing handles when their separate arrays are absent.
     */
    rounding?: number[];

    /** Optional four incoming cardinal handle multipliers, overridden by quadrant arrival fullness when that record is present.
     */
    roundingIn?: number[];

    /** Optional four outgoing cardinal handle multipliers, overridden by quadrant departure fullness when that record is present.
     */
    roundingOut?: number[];

    /** Optional per-quadrant departure and arrival handle multipliers in outer, anterior, inner, posterior traversal order.
     */
    quadrantFullness?: Record<
      | "outerToAnterior"
      | "anteriorToInner"
      | "innerToPosterior"
      | "posteriorToOuter",
      {
        /** Dimensionless multiplier for the outgoing handle at this quadrant start.
         */
        departure: number;

        /** Dimensionless multiplier for the incoming handle at this quadrant end.
         */
        arrival: number;
      }
    >;
  }

  /** Complete named input for one pelvis epoch. Stations are ascending in physical Y; the actual upstream waist supplies the upper boundary and full jet. Optional roof and support records are interpreted only by their owning epoch.
   *
   * @author Samchon
   */
  export interface Input {
    /** Descriptive provenance label only; the generator never dispatches geometry by this string.
     */
    gate: string;

    /** Native physical origin and median X offset used by every named station before parent placement.
     */
    frame: Frame;

    /** Dimensionless lateral lane ratios; posterior entries place the left and right posterior supports.
     */
    lanes: {
      /** Reserved anterior lane ratios; the current section rules obtain anterior X positions from the waist/thigh fan instead.
       */
      anterior?: [number, number];

      /** Left and right posterior support X distances as fractions of their respective half breadths.
       */
      posterior: [number, number];
    };

    /** Ascending physical merged-body courses; the upstream waist replaces the last R6b course or appends the last V17 course.
     */
    mergedStations: MergedStation[];

    /** Ascending lower-to-upper paired-thigh courses for each side; their first course owns the downstream thigh port.
     */
    pairedStations: Record<Side, PairedStation[]>;

    /** One distal physical course per side used to derive the lower thigh support and outgoing-handle d/dY jets.
     */
    thighDerivativeContext: Record<Side, PairedStation>;

    /** Optional four positive angular widths per side; omission uses four unit quarters, later normalized only for published turns.
     */
    pairedPhaseIntervals?: Record<Side, number[]>;

    /** Default four cardinal handle multipliers for each paired thigh, used when station-specific fullness is absent.
     */
    pairedRounding: Record<Side, number[]>;

    /** Five merged-course handle multipliers for lateral, anterior, anterior median, posterior lane and posterior median supports.
     */
    sectionRounding: number[];

    /** Reserved descriptive anterior-lane record; the current generator does not read it as a geometric authority.
     */
    anteriorLaneRule?: object;

    /** Epoch-specific named roof dimensions and descriptive fields; R6b requires finite numeric values for each dimension it reads.
     */
    roof?: Record<string, number | string>;

    /** Optional R6b engineering-closure target; this auxiliary closure is not an anatomical skin feature.
     */
    saddle?: {
      /** Engineering saddle XYZ minus measurement origin in millimetres.
       */
      offsetFromFrame_mm: Vec;
    };
  }

  /** Separate external R6b sparse-roof and interior V17 support topologies; selecting one does not inherit the other's form or seam acceptance.
   */
  export type Epoch = "external-r6b" | "interior-v17";
}
