import type { IAutoMovieCurve64 as C } from "@automovie/engine";

/** Internal dimensional record consumed by the twelve-lane torso family. The public converter derives these values from physical measurements and explicit conventions; callers do not supply sampled curves. Ratios use trunkLengthMm, while each gauge names its owning bone. */
export namespace ITorsoMeasurements {
  /**
   * Proper orthonormal measurement gauge before world placement. The origin is in millimetres and the axes are dimensionless directions in the enclosing bone frame.
   *
   * @author Samchon
   */
  export interface Gauge {
    /** Origin in millimetres relative to the enclosing owning-bone gauge. */
    origin: C.Vector;

    /** Unit first measurement axis: trunk lateral X or collar U, as defined by the enclosing record. */
    basisX: C.Vector;

    /** Unit longitudinal axis: trunk up direction or collar outward normal, as defined by the enclosing record. */
    basisY: C.Vector;

    /** Unit anterior measurement axis completing the proper right-handed gauge. */
    basisZ: C.Vector;
  }

  /**
   * One horizontal course's twelve semantic support dimensions. Height, center and depth ratios multiply trunkLengthMm; root X ratios instead multiply that course's half-breadth. The two median supports lie on local X=0.
   *
   * @author Samchon
   */
  export interface Section {
    /** Physical course height relative to the trunk origin, divided by trunkLengthMm. */
    heightRatio: number;

    /** Lateral center offset divided by trunkLengthMm; positive is subject-left. */
    centerLateralRatio: number;

    /** Positive half-breadth divided by trunkLengthMm. */
    halfBreadthRatio: number;

    /** Left root lane nearest the lateral support, as a fraction of course half-breadth. */
    leftRootInnerXRatio: number;

    /** Left root lane toward the anterior mass, as a fraction of course half-breadth. */
    leftRootOuterXRatio: number;

    /** Right root lane nearest the lateral support, as a positive half-breadth fraction; the family applies its negative X sign. */
    rightRootInnerXRatio: number;

    /** Right root lane toward the anterior mass, as a positive half-breadth fraction; the family applies its negative X sign. */
    rightRootOuterXRatio: number;

    /** Signed anterior coordinate of the left flank depth support, divided by trunkLengthMm; posterior values may be negative. */
    leftFlankDepthRatio: number;

    /** Signed anterior coordinate of the left anterior root inner depth support, divided by trunkLengthMm; posterior values may be negative. */
    leftAnteriorRootInnerDepthRatio: number;

    /** Signed anterior coordinate of the left anterior root outer depth support, divided by trunkLengthMm; posterior values may be negative. */
    leftAnteriorRootOuterDepthRatio: number;

    /** Signed anterior coordinate of the left anterior depth support, divided by trunkLengthMm; posterior values may be negative. */
    leftAnteriorDepthRatio: number;

    /** Signed anterior coordinate of the midline sternal support divided by trunkLengthMm. */
    medianAnteriorDepthRatio: number;

    /** Signed anterior coordinate of the right anterior depth support, divided by trunkLengthMm; posterior values may be negative. */
    rightAnteriorDepthRatio: number;

    /** Signed anterior coordinate of the right anterior root outer depth support, divided by trunkLengthMm; posterior values may be negative. */
    rightAnteriorRootOuterDepthRatio: number;

    /** Signed anterior coordinate of the right anterior root inner depth support, divided by trunkLengthMm; posterior values may be negative. */
    rightAnteriorRootInnerDepthRatio: number;

    /** Signed anterior coordinate of the right flank depth support, divided by trunkLengthMm; posterior values may be negative. */
    rightFlankDepthRatio: number;

    /** Signed anterior coordinate of the right posterior depth support, divided by trunkLengthMm; posterior values may be negative. */
    rightPosteriorDepthRatio: number;

    /** Signed anterior coordinate of the midline spinal support divided by trunkLengthMm. */
    medianPosteriorDepthRatio: number;

    /** Signed anterior coordinate of the left posterior depth support, divided by trunkLengthMm; posterior values may be negative. */
    leftPosteriorDepthRatio: number;
  }

  /**
   * Semantic feature displacement from the course's declared origin. Each component is dimensionless; the enclosing shoulder span or trunk length supplies the physical scale.
   *
   * @author Samchon
   */
  export interface Offset {
    /** Lateral component divided by the owner scale; shoulder features use outward-positive magnitude with a side sign, while external branches use signed trunk X. */
    lateralOffsetRatio: number;

    /** Upward displacement divided by the enclosing course's declared physical scale. */
    verticalOffsetRatio: number;

    /** Anterior displacement divided by the enclosing course's declared physical scale. */
    anteriorOffsetRatio: number;
  }

  /**
   * Shoulder support displacement and its tangent-plane normal. Normal angles describe a unit direction in the trunk measurement basis, not a measured anatomical landmark.
   *
   * @author Samchon
   */
  export interface Feature extends Offset {
    /** Tangent-plane normal elevation in degrees above the trunk XZ plane. */
    surfaceNormalElevationDeg: number;

    /** Tangent-plane normal azimuth in degrees, measured from trunk +X toward +Z. */
    surfaceNormalAzimuthDeg: number;
  }

  /**
   * Ordered shoulder supports and their common interpolation chart. Feature insertion order must match the interior phase stations; the endpoints come from the real neck and arm collar.
   *
   * @author Samchon
   */
  export interface Course {
    /** Ordered semantic interior supports; insertion order corresponds to the course phase chart. */
    features: Readonly<Record<string, Feature>>;

    /** Strictly increasing course coordinates including both endpoints; the public shoulder rule derives them from physical chords through cervical exit, acromial cover and deltoid transition. */
    phaseStations: readonly number[];
  }

  /**
   * Four-pole proximal-arm section in its upper-arm bone gauge. Offsets permit asymmetric poles; the factory uses the same quarter-circle cubic handle rule and a constant normal continuation.
   *
   * @author Samchon
   */
  export interface Collar {
    /** Measurement origin and proper axes expressed relative to the owning bone. */
    frame: Gauge;

    /** Four cardinal pole distances and offsets in the collar's local U/front plane, in millimetres. */
    skin: {
      /** Positive distance along the collar's +U axis in millimetres. */
      positiveUHalfBreadthMm: number;

      /** Anterior offset of the +U pole in millimetres. */
      positiveUDepthOffsetMm: number;

      /** U offset of the front pole in millimetres. */
      anteriorBreadthOffsetMm: number;

      /** Positive front-pole distance in millimetres. */
      anteriorHalfDepthMm: number;

      /** Positive distance along the collar's -U axis in millimetres. */
      negativeUHalfBreadthMm: number;

      /** Anterior offset of the -U pole in millimetres. */
      negativeUDepthOffsetMm: number;

      /** U offset of the back pole in millimetres. */
      posteriorBreadthOffsetMm: number;

      /** Positive back-pole distance in millimetres. */
      posteriorHalfDepthMm: number;
    };

    /** Normal handle displacement in millimetres; raw adjacent collar Q subtracts this vector before decoding with delta=-1/3. */
    continuationHandleLengthMm: number;
  }

  /**
   * Complete internal input to the torso factory. Sections are ordered by increasing physical height, including one lower derivative support; the public generator supplies a common rule for every course. AxillaryThorax is an internal engineering core, while externalBranches describe separate arm junction guides.
   *
   * @author Samchon
   */
  export interface Value {
    /** Positive suprasternale-to-natural-waist length in millimetres used to dimensionalize internal ratios. */
    trunkLengthMm: number;

    /** Measurement origin and proper axes expressed relative to the owning bone. */
    frame: Gauge;

    /** Left/right anterior and posterior lane distances as positive fractions of the course half-breadth. */
    pairedLaneRatios: {
      /** Subject-left/right anterior lane distances as positive fractions of section half-breadth. */
      anterior: readonly [number, number];

      /** Subject-left/right posterior lane distances as positive fractions of section half-breadth. */
      posterior: readonly [number, number];
    };

    /** Increasing-height semantic course records; the first is an engineering derivative support and axillaryThorax is an internal core rather than an exterior skin loop. */
    sections: Readonly<Record<string, Section>>;

    /** Dimensionless multipliers of one-third angular derivatives at lateral, anterior and posterior supports; the public common rule sets them to one. */
    sectionFullness: Readonly<
      Record<
        string,
        {
          /** Dimensionless angular-derivative multiplier at the two lateral supports. */
          flank: number;

          /** Dimensionless angular-derivative multiplier at anterior supports, including their median. */
          anterior: number;

          /** Dimensionless angular-derivative multiplier at posterior supports, including their median. */
          posterior: number;
        }
      >
    >;

    /** Median height of the underfold proxy divided by trunkLengthMm. */
    foldMedianHeightRatio: number;

    /** Anterior-root height of the underfold proxy divided by trunkLengthMm. */
    foldRootHeightRatio: number;

    /** Owned subject-left and subject-right proximal collar dimensions in their respective upper-arm bone gauges. */
    upperArms: {
      /** Subject-left collar dimensions and gauge in that actual upper-arm bone. */
      left: Collar;

      /** Subject-right collar dimensions and gauge in that actual upper-arm bone. */
      right: Collar;
    };

    /** Three named physical courses per side connecting the real neck to the owned arm collar. */
    shoulders: {
      /** Subject-left crest, clavicle and scapular courses from neck to arm collar. */
      left: {
        /** Named crest, anterior clavicle and posterior scapular course definitions sharing the same phase convention. */
        courses: Readonly<Record<string, Course>>;
      };

      /** Subject-right crest, clavicle and scapular courses from neck to arm collar. */
      right: {
        /** Named crest, anterior clavicle and posterior scapular course definitions sharing the same phase convention. */
        courses: Readonly<Record<string, Course>>;
      };
    };

    /** Sternal and spinal median feature ratios between the upper-thorax section and actual mid-neck. */
    upperMedian: Readonly<
      Record<
        string,
        {
          /** Ordered semantic interior supports; insertion order corresponds to the course phase chart. */
          features: Readonly<
            Record<
              string,
              {
                /** Relative physical height between the upper-thorax and actual mid-neck planes, strictly inside (0,1). */
                heightFraction: number;

                /** Anterior displacement from the upper-thorax median divided by that bridge's physical height. */
                depthChangeOverHeight: number;
              }
            >
          >;
        }
      >
    >;

    /** Named floor, anterior-fold and posterior-fold offsets connecting the internal trunk core to each arm collar; these are distinct from the core section. */
    externalBranches: {
      /** Subject-left floor and fold offsets for the separate external arm junction guides. */
      left: Readonly<Record<string, Offset>>;

      /** Subject-right floor and fold offsets for the separate external arm junction guides. */
      right: Readonly<Record<string, Offset>>;
    };

    /** The trunk measurement gauge expressed independently in each actual upper-arm bone frame. */
    branchFrames: {
      /** Subject-left copy of the trunk measurement gauge expressed in that upper-arm bone. */
      left: Gauge;

      /** Subject-right copy of the trunk measurement gauge expressed in that upper-arm bone. */
      right: Gauge;
    };

    /** Owning parent bone names for trunk and bilateral collars; placement is resolved through the shared context. */
    bones: {
      /** Trunk's actual owning bone, normally spine. */
      root: string;

      /** Subject-left upper-arm owner bone name used for contextual placement. */
      left: string;

      /** Subject-right upper-arm owner bone name used for contextual placement. */
      right: string;
    };

    /** Canonical upstream neck and owned waist/upper-arm identities used for publish/bind. */
    boundaryIds: {
      /** Canonical identity of the real face-owned neck operator consumed from the upstream map. */
      neck: string;

      /** Owned natural-waist boundary identity for the pelvis consumer. */
      waist: string;

      /** Subject-left owned upper-arm boundary identity used by the arm consumer. */
      left: string;

      /** Subject-right owned upper-arm boundary identity used by the arm consumer. */
      right: string;
    };
  }

  /** Calibration-shaped variant retained for internal adapters. Frame-space and course-model literals identify that record's convention; this is not a public identity or a saved control network. */
  export type Source = Omit<
    Value,
    "bones" | "boundaryIds" | "branchFrames" | "upperArms"
  > & {
    /** Literal identifying the semantic physical-course adapter convention. */
    upperCourseModel: "semanticPhysicalV2";

    /** Owned subject-left and subject-right proximal collar dimensions in their respective upper-arm bone gauges. */
    upperArms: {
      /** Subject-left collar dimensions and gauge in that actual upper-arm bone. */
      left: Collar & {
        /** Literal stating that this collar gauge is relative to its owning parent bone. */
        frameSpace: "parent-local";
      };

      /** Subject-right collar dimensions and gauge in that actual upper-arm bone. */
      right: Collar & {
        /** Literal stating that this collar gauge is relative to its owning parent bone. */
        frameSpace: "parent-local";
      };
    };
  };
}
