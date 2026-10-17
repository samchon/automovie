import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import type { IAutoMovieFaceEarMeasurements as E } from "./IAutoMovieFaceEarMeasurements";
import type { IAutoMovieFaceHeadMeasurements as H } from "./IAutoMovieFaceHeadMeasurements";

/** Internal semantic inputs for the face curve family. Lengths are native mm unless an explicit ratio, angle, phase or derivative unit is stated. Registration and physical dimensions remain separate.
 *
 * @author Samchon
 */
export namespace IAutoMovieFaceMeasurements {
  /** Anatomical side in the subject frame; positive native X denotes the subject's left. */
  export type Side = "left" | "right";

  /** Twelve angular supports ordered from anterior midline through subject-left, posterior midline and subject-right. Each lane supplies a Bernstein knot and outgoing angular handle. */
  export type Lane = H.Lane;

  /** Named descending head sections. The factory requires strictly ordered physical Y heights; these labels do not select stored specimen coordinates. */
  export type Station = H.Station;

  /** Second-order Taylor data in longitudinal neck offset h, in mm: value + slope*h + curvature*h*h/2. Units follow the represented quantity and its first two derivatives. */
  export type Polynomial<T> = H.Polynomial<T>;

  /** Quadratic family of four-span neck sections. Evaluating at h=0 supplies the shared mid-tube P and full transverse derivative J. */
  export type Neck = H.Neck;

  /** One dimensionless head support section relative to the declared head origin, chin plane and physical dimensions. It seeds the continuous longitudinal fields. */
  export type Section = H.Section;

  /** Dimensioned mandibular support course from chin through parasymphysis, body, angle and ramus. These are geometric support proxies, not a fitted mandible surface. */
  export type JawSide = H.JawSide;

  /** Head and upper-neck construction inputs in one native physical-Y chart. Closed supports define curves only; they do not fill facial apertures or certify a skin limit. */
  export type Head = H.Head;

  /** Oral chart anchored separately from the nose. All offsets are native mm; borders, roll crests and the coincident neutral contact remain distinct courses.
   *
   * @author Samchon
   */
  export interface Oral {
    /** Native stomion/contact anchor, mm. The neutral contact passes through this point. */
    origin: C.Vector;

    /** Full commissure-to-commissure X span, mm; both corners share rise and depth. */
    width: number;

    /** Full X distance between the two Cupid supports, mm. */
    cupidWidth: number;

    /** Signed Y offset of both commissures from origin, mm. */
    cornerRise: number;

    /** Signed Z offset of both commissures from origin, mm; negative values recede. */
    cornerDepth: number;

    /** Central upper vermilion Y rise above origin, mm. */
    upperBorderRise: number;

    /** Central upper vermilion Z offset from origin, mm. */
    upperBorderDepth: number;

    /** Additional Y rise of each Cupid support above the central upper-border rise, mm. */
    cupidRise: number;

    /** Cupid support Z offset from origin, mm; it is not added to upperBorderDepth. */
    cupidDepth: number;

    /** Positive Y drop from origin to the central lower vermilion border, mm. */
    lowerBorderDrop: number;

    /** Central lower vermilion Z offset from origin, mm. */
    lowerBorderDepth: number;

    /** Signed central upper-roll Y offset from origin, mm. */
    upperRollRise: number;

    /** Central upper-roll Z offset from origin, mm. */
    upperRollDepth: number;

    /** Signed central lower-roll Y offset from origin, mm; normally negative. */
    lowerRollRise: number;

    /** Central lower-roll Z offset from origin, mm. */
    lowerRollDepth: number;

    /** Positive X magnitude of bilateral roll/lateral-border shoulders, mm; must lie between midline and commissure for the intended family. */
    rollShoulderX: number;

    /** Y displacement of upper shoulders relative to upperRollRise, mm. */
    upperRollShoulderRise: number;

    /** Y displacement of lower shoulders relative to lowerRollRise, mm. */
    lowerRollShoulderRise: number;

    /** Absolute upper-shoulder Z offset from oral origin, mm. */
    upperRollShoulderDepth: number;

    /** Absolute lower-shoulder Z offset from oral origin, mm. */
    lowerRollShoulderDepth: number;

    /** Upper-border lateral support Y offset from origin, mm. */
    upperLateralRise: number;

    /** Upper-border lateral support Z offset from origin, mm. */
    upperLateralDepth: number;
  }

  /** Independent native nasal chart. Linear offsets are mm and analytic nostril rotations are radians; these curves do not create an open nasal surface.
   *
   * @author Samchon
   */
  export interface Nasal {
    /** Native subnasal anchor, mm; the columella terminates here. */
    origin: C.Vector;

    /** Nasal root Y offset above origin, mm. */
    rootRise: number;

    /** Signed root Z offset from origin, mm; normally posterior. */
    rootDepth: number;

    /** Tip Y offset above origin, mm. */
    tipRise: number;

    /** Tip Z offset from origin, mm. */
    tipDepth: number;

    /** Full bilateral alar X span, mm. */
    width: number;

    /** Positive Y drop of the lateral alar support below tipRise, mm. */
    alarDrop: number;

    /** Lateral alar support Z offset from origin, mm. */
    alarDepth: number;

    /** Y rise of the superior alar shoulder above tipRise, mm. */
    alarShoulderRise: number;

    /** Superior alar shoulder Z offset from origin, mm. */
    alarShoulderDepth: number;

    /** Positive X magnitude of the sidewall root support, mm. */
    rootHalfWidth: number;

    /** Additional posterior offset of the sidewall root relative to rootDepth, mm. */
    rootEdgeRecession: number;

    /** X distance between analytic nostril centers, mm. */
    nostrilSpacing: number;

    /** Nostril-center Y offset from origin, mm. */
    nostrilRise: number;

    /** Nostril-center Z offset from origin, mm. */
    nostrilDepth: number;

    /** Positive analytic semiaxis along the nostril lateral axis, mm. */
    nostrilRadiusU: number;

    /** Positive analytic semiaxis along the orthogonal nostril plane axis, mm. */
    nostrilRadiusV: number;

    /** Radians rotating the lateral nostril axis into posterior Z with mirrored anatomical X. */
    nostrilRecessionAngle: number;

    /** Radians tilting the second nostril axis toward inferior Y; used with recession to construct orthonormal axes. */
    nostrilPlaneAngle: number;
  }

  /** Shared dimensionless oral/nasal Hermite support and tangent coefficients. Each name identifies the factor applied in generateFaceNoseMouth; the supplied values are family-shape conventions, not survey measurements. */
  export type RoundingName =
    | "cornerTangentShare"
    | "cornerRiseShare"
    | "cupidTangentShare"
    | "lowerMidTangentShare"
    | "shoulderTangentShare"
    | "shoulderDepthShare"
    | "profileBorderTangentShare"
    | "profileDepthShare"
    | "profileRollTangentShare"
    | "profileContactTangentShare"
    | "nasalTipTangentShare"
    | "dorsumShoulderHeight"
    | "dorsumShoulderDepth"
    | "dorsumRootTangent"
    | "dorsumMidTangent"
    | "dorsumDepthTangent"
    | "columellaTangent"
    | "alarShoulderWidth"
    | "alarVerticalTangent"
    | "alarDepthTangent"
    | "alarShoulderTangent"
    | "alarMedialDepthTangent"
    | "alarBaseTangent"
    | "alarBaseDrop"
    | "wallLateralTangent"
    | "wallVerticalTangent"
    | "philtralNasalSpan"
    | "philtralTangent"
    | "lateralBorderSlopeShare";

  /** Separate oral/nasal anchors plus common dimensionless rounding coefficients for exact cubic and analytic-oval construction.
   *
   * @author Samchon
   */
  export interface NoseMouth {
    /** Contact, border and roll dimensions in the independent oral chart. */
    oral: Oral;

    /** Dorsum, alar, sidewall and nostril dimensions in the independent nasal chart. */
    nasal: Nasal;

    /** Named dimensionless factors multiplying physical spans or profile differences before Hermite conversion. */
    rounding: Record<RoundingName, number>;
  }

  /** Polynomial Z perturbation above the straight canthal endpoint line; coefficients use mm.
   *
   * @author Samchon
   */
  export interface Depth {
    /** Even midpoint depth bulge, mm; endpoint depth is unchanged. */
    bulgeMm: number;

    /** Odd cubic depth asymmetry, mm; skews the arch without moving either endpoint. */
    skewMm: number;
  }

  /** One upper or lower lid polynomial. Arch sign and required role keys come from its enclosing Eye and generateFaceEyes.
   *
   * @author Samchon
   */
  export interface Lid {
    /** Signed midpoint Y arch above the straight canthal line, mm. */
    archHeightMm: number;

    /** Odd cubic Y skew coefficient, mm; it vanishes at endpoints and at the midpoint. */
    archSkewMm: number;

    /** Role-specific Z polynomial; the generator requires aperture-margin, lid-roll and the appropriate fold/infraorbital key despite the partial record type. */
    depth: Partial<
      Record<
        "aperture-margin" | "lid-roll" | "lid-fold" | "infraorbital-transition",
        Depth
      >
    >;
  }

  /** Bilateral skin-aperture proxy and support polynomials. This record does not certify globe contact or generate an ocular mesh.
   *
   * @author Samchon
   */
  export interface Eye {
    /** Native medial anchor and signed lateral-end recession for every lid role. */
    placement: {
      /** Medial canthal proxy in native mm; the polynomial endpoints are built from this point. */
      medialAnchorMm: C.Vector;

      /** Signed lateral endpoint Z displacement from the medial endpoint, mm. */
      canthalRecessionMm: number;
    };

    /** Positive transverse canthal X extent, mm; distinct from the full clinical 3D chord. */
    projectedApertureWidthMm: number;

    /** Canthal endpoint slope angle in degrees; Y rise equals projected width times its tangent. */
    canthalSlantDegrees: number;

    /** Ocular-envelope bookkeeping retained by the converter. generateFaceEyes emits no ring or mesh from this object. */
    eyeComponent: {
      /** Recorded current eye-child center, native mm; not consumed by the curve emitter. */
      centerMm: C.Vector;

      /** Recorded three-axis mm radii; the emitter does not use this tuple. The upstream converter uses only slot 2 for medial-anchor Z placement. */
      radiiMm: C.Vector;
    };

    /** Independent brow-support endpoint and depth-arch quantities; this is not a hair attachment surface. */
    browDepth: {
      /** Absolute native Z of the brow-support medial endpoint, mm. */
      medialZMm: number;

      /** Brow lateral endpoint Z displacement from its medial endpoint, mm. */
      recessionMm: number;

      /** Brow even midpoint Z bulge above its endpoint line, mm. */
      bulgeMm: number;

      /** Brow odd cubic Z skew coefficient, mm. */
      skewMm: number;
    };

    /** Upper lid roles; their positive arch offsets expand above the aperture. */
    upper: Lid;

    /** Lower lid roles; support offsets are applied with the inferior sign. */
    lower: Lid;
  }

  /** Bilateral eye aperture courses and shared support offsets; no ocular-component primitives are emitted.
   *
   * @author Samchon
   */
  export interface Eyes {
    /** Independent subject-left and subject-right aperture and depth records. */
    eyes: Record<Side, Eye>;

    /** Shared arch offsets and brow dimensions applied to both sides after their independent placements. */
    supports: {
      /** Y-arch addition to the aperture margin, mm, signed by upper/lower role. */
      marginArchOffsetMm: number;

      /** Y-arch addition from margin to roll support, mm, signed by upper/lower role. */
      rollArchOffsetMm: number;

      /** Superior Y-arch addition for the upper fold support, mm. */
      upperFoldArchOffsetMm: number;

      /** Inferior Y-arch addition for the lower infraorbital transition, mm. */
      lowerTransitionArchOffsetMm: number;

      /** Brow-support polynomial extent relative to each medial canthal proxy; not rendered hair dimensions. */
      brow: {
        /** Medial extension divided by projected aperture width. */
        medialExtensionWidthRatio: number;

        /** Full brow-support X span divided by projected aperture width. */
        widthRatio: number;

        /** Brow medial endpoint Y rise above the medial canthal proxy, mm. */
        heightAboveMedialProxyMm: number;

        /** Y drop subtracted from canthal endpoint rise at the brow tail, mm. */
        tailDropMm: number;

        /** Even midpoint brow Y bulge above its endpoint line, mm. */
        archHeightMm: number;

        /** Odd cubic brow Y skew coefficient, mm. */
        archSkewMm: number;
      };
    };
  }

  /** Dimensionless posterior/height/outward coordinates. Cartilage features use helix breadth, helix height and protrusion; concha features use their own dimensions. */
  export type EarRatio = E.EarRatio;

  /** One bowed cubic between named auricular supports; bow is the intended midpoint displacement from the endpoint chord. */
  export type EarArc = E.EarArc;

  /** Inclined auricular course sampled into four Hermite cubics, with cubic depth interpolation across the entire signed phase interval. */
  export type EarOval = E.EarOval;

  /** Semantic open cartilage/support courses emitted separately from the helix, concha rim, lobule and conventional insertion. */
  export type EarFeature = E.EarFeature;

  /** Dimensioned auricle in a posterior/superior/outward chart. Rotation maps it to subject coordinates; insertion remains a separate conventional closed course. */
  export type Ear = E.Ear;

  /** Bilateral auricular curves sharing one additional native translation. */
  export type Ears = E.Ears;

  /** Complete regional curve-construction instance. It supplies physical semantics and registration separately; no clinical or surface certificate follows from construction.
   *
   * @author Samchon
   */
  export interface Identity {
    /** Descriptive provenance label only; the runtime performs no gate lookup. */
    gate: string;

    /** Positive finite uniform physical length scale applied at native-to-neck registration; fullJ uses mm/mm and therefore does not receive this factor. */
    scale: number;

    /** Head, jaw-floor and quadratic upper-neck family parameters. */
    head: Head;

    /** Independent oral/nasal profiles, feature courses and analytic nostril ovals. */
    noseMouth: NoseMouth;

    /** Aperture, roll/fold and brow support courses; excludes ocular component geometry. */
    eyes: Eyes;

    /** Bilateral auricular family and separate conventional insertion courses. */
    ears: Ears;
  }

  /** Proper native-to-neck rest registration, resolved internally from the actual skeleton. This chart admits longitudinal child motion but rejects relative head rotation or lateral displacement.
   *
   * @author Samchon
   */
  export interface Registration {
    /** Owning neck frame identifier used to place all controls and publish neck.midTube. */
    neckBone: string;

    /** Actual child head frame identifier; its parent must equal neckBone. */
    headBone: string;

    /** Native mm origin subtracted before uniform scaling and proper rotation. */
    sourceOriginMm: C.Vector;

    /** Proper 3x3 native-to-neck rotation. Orthonormality and positive determinant are checked; scale and shear are rejected. */
    sourceAxesInNeck: C.Matrix;

    /** Neck-local mm translation applied after rotating/scaling native displacements. */
    sourceOriginInNeckMm: C.Vector;

    /** Declared native mm position of the head-child origin used to detect its allowed longitudinal movement. */
    headOriginNativeMm: C.Vector;
  }
}
