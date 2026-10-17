import type { IAutoMovieCurve64 as C } from "@automovie/engine";

/**
 * Dimensional inputs to the foot section, toe and shared-web families.
 *
 * Lengths use millimetres. Local X points anatomically outward, Y upward and Z
 * forward; the placement applies chirality separately from its proper axes.
 * These internal recipes generate controls and are not public identity inputs.
 */
export namespace IAutoMovieFootDimensions64 {
  /**
   * Transverse support proportions between the supplied sole and dorsal heights.
   * Optional supports are omitted when their height fraction is absent.
   *
   * @author Samchon
   */
  export interface Profile {
    /** Roof peak X fraction from the medial edge toward the lateral edge. */
    roofPeakFraction: number;

    /** Plantar contact X fraction from the medial edge toward the lateral edge. */
    soleContactFraction: number;

    /** Lateral wall height as a fraction of dorsal height minus sole height. */
    outerWallHeightFraction: number;

    /** Medial wall height as a fraction of dorsal height minus sole height. */
    innerWallHeightFraction: number;

    /** Plantar support elevation above the recipe's floor datum, in millimetres. */
    soleHeightAboveFloor_mm: number;

    /** Height fraction at the midpoint between lateral wall and roof peak. */
    upperOuterHeightFraction?: number;

    /** Height fraction at the midpoint between medial wall and roof peak. */
    upperInnerHeightFraction?: number;

    /** Height fraction between medial wall and plantar contact. */
    plantarInnerHeightFraction?: number;

    /** Height fraction between lateral wall and plantar contact. */
    plantarOuterHeightFraction?: number;
  }

  /**
   * One named main-foot support row before longitudinal interpolation.
   *
   * @author Samchon
   */
  export interface Course extends Profile {
    /** Signed Z divided by heel reach when negative, or web reach otherwise. */
    longitudinalRatio: number;

    /** Signed lateral centre displacement divided by foot breadth. */
    centerOutwardRatio: number;

    /** Transverse support width divided by foot breadth. */
    breadthRatio: number;

    /** Dorsal height above the floor divided by instep height. */
    dorsalHeightRatio: number;

    /** Medial wall elevation divided by the arch scale; used in the anterior arch band. */
    innerArchRatio: number;

    /** Medial plantar elevation divided by the arch scale in that same band. */
    plantarInnerArchRatio: number;

    /** Lateral ankle shoulder X fraction across this row's width. */
    ankleOuterShoulderOutwardFraction: number;

    /** Lateral shoulder height fraction from its wall toward collar pole height. */
    ankleOuterShoulderHeightFraction: number;

    /** Medial ankle shoulder X fraction across this row's width. */
    ankleInnerShoulderOutwardFraction: number;

    /** Medial shoulder height fraction from its wall toward collar pole height. */
    ankleInnerShoulderHeightFraction: number;
  }

  /**
   * One toe row between the first emitted root section and the distal tip.
   * These sampling rows do not assert anatomical interphalangeal joints.
   *
   * @author Samchon
   */
  export interface ToeProfile extends Profile {
    /** Increasing station fraction in [0, 1), leaving the terminal cap at one. */
    fraction: number;

    /** Lateral displacement from the toe root centre divided by toe breadth. */
    centerOutwardOffsetRatio: number;

    /** Section width divided by the independent toe breadth. */
    breadthRatio: number;

    /** Section dorsal-to-plantar height divided by independent toe thickness. */
    thicknessRatio: number;
  }

  /**
   * Independent toe dimensions and dimensionless sparse-section proportions.
   *
   * @author Samchon
   */
  export interface Toe {
    /** Nominal root Z divided by the main foot's web reach. */
    rootLongitudinalRatio: number;

    /** Root centre X divided by foot breadth, positive anatomically lateral. */
    rootOutwardRatio: number;

    /** Forward distance from nominal root to tip; exceeds root gap, in millimetres. */
    projectedExtentAfterWeb_mm: number;

    /** Independent transverse toe width in millimetres. */
    breadth_mm: number;

    /** Independent dorsal-to-plantar toe thickness in millimetres. */
    thickness_mm: number;

    /** Tip lateral displacement from root centre divided by toe breadth. */
    tipOutwardOffsetRatio: number;

    /** Tip height above floor divided by toe thickness. */
    tipHeightRatio: number;

    /** Forward distance from nominal root to first section, in millimetres. */
    rootGap_mm: number;

    /** Terminal handle scale on the last section's transverse radial vector. */
    capRoundingRatio: number;

    /** Named rows, sorted by fraction before deriving longitudinal rails. */
    profiles: Readonly<Record<string, ToeProfile>>;
  }

  /**
   * Proper placement expressed in the transported ankle gauge at its cut centre.
   * The generator multiplies X by localChirality only after checking proper axes.
   *
   * @author Samchon
   */
  export interface Placement {
    /** Foot origin displacement from the actual cut centre, in parent-gauge millimetres. */
    originOffset_parent_mm: C.Vector;

    /** Proper local X direction expressed in the ankle gauge. */
    basisX_parent: C.Vector;

    /** Proper local Y direction expressed in the ankle gauge. */
    basisY_parent: C.Vector;

    /** Proper local Z direction expressed in the ankle gauge. */
    basisZ_parent: C.Vector;

    /** Anatomical outward sign; right-foot mirroring does not reflect the parent frame. */
    localChirality: 1 | -1;
  }

  /**
   * Physical scales for the relative foot recipe; no output controls are inputs.
   *
   * @author Samchon
   */
  export interface Dimensions {
    /** Positive posterior heel distance from the local foot origin. */
    heelReach_mm: number;

    /** Positive forward distance used to scale main courses and branch stations. */
    forefootWebReach_mm: number;

    /** Ball breadth scaling transverse row proportions. */
    breadth_mm: number;

    /** Dorsal height scale above the local floor datum. */
    instepHeight_mm: number;

    /** Scale for anterior medial wall/plantar elevations; not a skin-contact claim. */
    medialArchHeight_mm: number;

    /** Signed local Y of the standing datum; no generated ground-fit is applied. */
    floorOffsetAlongLocalUp_mm: number;

    /** Positive distal collar extrusion along the ankle's proximal-mm derivative. */
    collarDrop_mm: number;
  }

  /**
   * Shared saddle location between adjacent toes, in the main foot's scales.
   *
   * @author Samchon
   */
  export interface Saddle {
    /** Signed lateral position divided by foot breadth. */
    outwardRatio: number;

    /** Saddle elevation above the local floor, in millimetres. */
    heightAboveFloor_mm: number;

    /** Forward position divided by web reach. */
    longitudinalRatio: number;
  }

  /**
   * Intermediate dorsal and plantar support for a toe's two-span parent branch.
   *
   * @author Samchon
   */
  export interface Fan {
    /** Signed branch centre X divided by foot breadth. */
    outwardRatio: number;

    /** Branch midpoint Z divided by web reach. */
    longitudinalRatio: number;

    /** Dorsal midpoint elevation above the local floor, in millimetres. */
    dorsalHeightAboveFloor_mm: number;

    /** Plantar midpoint elevation above the local floor, in millimetres. */
    plantarHeightAboveFloor_mm: number;
  }

  /**
   * Geometry owned by one foot, with five named toes and four shared webs.
   *
   * @author Samchon
   */
  export interface Side {
    /** Relative foot axes and explicit anatomical chirality. */
    placement: Placement;

    /** Millimetre scales and datum consumed by every generated support. */
    dimensions: Dimensions;

    /** Rear cap endpoint at negative heel reach. */
    heelPole: {
      /** Lateral pole position divided by foot breadth. */
      outwardRatio: number;

      /** Pole elevation above the floor, in millimetres. */
      heightAboveFloor_mm: number;
    };

    /** Named main support rows; their physical stations must increase after sorting. */
    courses: Readonly<Record<string, Course>>;

    /** Digit keys "1" through "5", from hallux to little toe. */
    toes: Readonly<Record<string, Toe>>;

    /** Main-to-toe transition definition consumed after both families are registered. */
    branches: {
      /** Parent transverse section Z divided by web reach. */
      parentLongitudinalRatio: number;

      /** Keys "1" through "4"; each node is shared by two adjacent toe branches. */
      saddles: Readonly<Record<string, Saddle>>;

      /** Keys "1" through "5"; each provides a dorsal/plantar branch midpoint. */
      fan: Readonly<Record<string, Fan>>;
    };
  }

  /**
   * Bone-local gauge in which canonical ankle poles and placement are interpreted.
   * Its origin is a coordinate reference, not an assertion that joint and cut agree.
   *
   * @author Samchon
   */
  export interface Binding {
    /** Consumer Foot bone resolved by the shared parent context. */
    bone: string;

    /** Actual upstream leg-owned ankle key, including any instance namespace. */
    boundaryId: string;

    /** Proper orthonormal gauge whose Y follows the upstream proximal axis. */
    ankleChart: {
      /** Gauge origin relative to the consumer bone, in millimetres. */
      originMm: C.Vector;

      /** Ordered X/Y/Z unit axes expressed in that bone's proper frame. */
      axes: C.Matrix;
    };
  }

  /**
   * Bilateral foot recipes and the separately owned canonical ankle bindings.
   *
   * @author Samchon
   */
  export interface Parameters {
    /** Independent left/right dimensions using one shared generation method. */
    sides: Readonly<Record<"left" | "right", Side>>;

    /** Matching current upstream keys and proper bone-local gauges. */
    bindings: Readonly<Record<"left" | "right", Binding>>;
  }
}
