/** Physical inputs to the hand curve family, before bone placement.
 *
 * Lengths are millimetres, angles are radians, and ratios are dimensionless. Registration maps the longitudinal/breadth/thickness measurement chart into the decoding gauge. These dimensions generate curves; they do not specify a mesh, nails, or an articulated skin surface.
 */
export namespace IHandCurveMeasurements {
  /** Ordered branches used by the shared palm and adjacent-web construction. */
  export type Digit = "thumb" | "index" | "middle" | "ring" | "pinky";

  /** Adjacent branch pairs with one shared skin-junction position each. */
  export type Web =
    | "thumb-index"
    | "index-middle"
    | "middle-ring"
    | "ring-pinky";

  /** Selects the Hand parent and the explicit local chirality convention. */
  export type Side = "left" | "right";

  /** Spherical direction in the measurement chart: [cos(elevation) cos(azimuth), cos(elevation) sin(azimuth), sin(elevation)].
   *
   * @author Samchon
   */
  export interface Angles {
    /** Rotation around the thickness axis, in radians. */
    azimuthRad: number;

    /** Angle above the longitudinal/breadth plane, in radians. */
    elevationRad: number;
  }

  /** Displacement from the registration origin before its rotation, in millimetres.
   *
   * @author Samchon
   */
  export interface Offset {
    /** Component along the measurement chart's longitudinal axis. */
    longitudinalMm: number;

    /** Component along the measurement chart's breadth axis. */
    breadthMm: number;

    /** Component along the measurement chart's thickness axis. */
    thicknessMm: number;
  }

  /** Four cardinal positions defining a closed cubic wrist or proximal-palm section.
   *
   * @author Samchon
   */
  export interface Section {
    /** Section centre relative to the registration origin. */
    origin: Offset;

    /** Normal before registration rotation; its plane basis projects gauge +X onto the transverse plane. */
    normalAngles: Angles;

    /** Signed coordinates along that plane's u/v axes, in millimetres, for the ordered breadth+, depth+, breadth-, depth- nodes; these labels identify chart positions rather than anatomical directions. */
    cardinalDimensions: Record<
      `${"breadthPositive" | "breadthNegative" | "depthPositive" | "depthNegative"}${"BreadthMm" | "DepthMm"}`,
      number
    >;

    /** Positive major-radius measurement in millimetres; the smaller declared radius sets the longitudinal collar-handle scale. */
    majorRadiusMm: number;

    /** Positive minor-radius measurement in millimetres; cardinal coordinates, rather than these radii, determine the emitted section shape. */
    minorRadiusMm: number;
  }

  /** Ellipse generator at a named physical station on a digit chain; emission approximates it with four cubic spans.
   *
   * @author Samchon
   */
  export interface TubeSection {
    /** Unique station identifier within its digit; the legacy middle_0.00 station is excluded from emission. */
    name: string;

    /** Chain interval: 0 and 1 join the three roots; 2 follows the distal skin-tip axis. */
    segment: 0 | 1 | 2;

    /** Position in [0, 1] along the selected interval, using skinTip.reachMm for interval 2. */
    fraction: number;

    /** Positive major semiaxis length in millimetres. */
    ellipseMajorRadiusMm: number;

    /** Positive minor semiaxis length in millimetres. */
    ellipseMinorRadiusMm: number;

    /** Major-axis rotation from the transverse u axis toward v, in radians. */
    ellipseRollRad: number;

    /** Centre displacement along transverse u, in millimetres. */
    centerAcrossMm: number;

    /** Centre displacement along transverse v, in millimetres. */
    centerDepthMm: number;

    /** Centre displacement along the interval normal, in millimetres. */
    centerAxialMm: number;
  }

  /** One three-root digit chain and its skin-section dimensions; thumb interval 0 represents the metacarpal chain.
   *
   * @author Samchon
   */
  export interface Finger {
    /** Root longitudinal displacement divided by palmLengthMm. */
    rootLongitudinalRatio: number;

    /** Root breadth displacement divided by palmLengthMm. */
    rootBreadthRatio: number;

    /** Root thickness displacement divided by palmLengthMm. */
    rootDepthRatio: number;

    /** Exactly two positive-length root-to-root intervals with directions in the measurement chart. */
    segments: readonly (Angles & {
      /** Root-to-root interval length in millimetres. */
      lengthMm: number;
    })[];

    /** Named transverse stations ordered from the branch toward the tip. */
    tubeSections: readonly TubeSection[];

    /** Distal skin endpoint relative to the third root and its local transverse frame. */
    skinTip: {
      /** Direction of the terminal interval, independent of its transverse offsets. */
      distalAxisAngles: Angles;

      /** Positive axial reach from the third root, in millimetres. */
      reachMm: number;

      /** Endpoint offset along terminal-frame u, in millimetres. */
      offsetAcrossMm: number;

      /** Endpoint offset along terminal-frame v, in millimetres. */
      offsetDepthMm: number;
    };

    /** Dorsal and volar branch supports, separate from the mechanical root centre. */
    rootThickness: {
      /** Root interval on which the thickness supports are located. */
      segment: 0 | 1;

      /** Position in [0, 1] along that root interval. */
      fraction: number;

      /** Positive reach along the interval-frame u axis, in millimetres. */
      dorsalReachMm: number;

      /** Positive reach opposite the interval-frame u axis, in millimetres. */
      volarReachMm: number;
    };
  }

  /** Complete unilateral construction input; the factory clones it before generation.
   *
   * @author Samchon
   */
  export interface Detailed {
    /** Recipe version metadata; the current factory does not dispatch on this value. */
    version: number;

    /** Required family discriminator, checked by the factory. */
    region: "hands";

    /** Descriptive provenance label; no geometry branch or catalogue lookup uses it. */
    gate: string;

    /** Measurement-chart origin and Rz * Ry * Rx rotation into the decoding gauge; the Hand context supplies final world placement. */
    registration: {
      /** Gauge origin X component in millimetres, subtracted before parent placement. */
      wristWorldXmm: number;

      /** Gauge origin Y component in millimetres. */
      wristWorldYmm: number;

      /** Gauge origin Z component in millimetres. */
      wristWorldZmm: number;

      /** First applied rotation about X, in radians. */
      rotationXrad: number;

      /** Second applied rotation about Y, in radians. */
      rotationYrad: number;

      /** Last applied rotation about Z, in radians. */
      rotationZrad: number;
    };

    /** Positive length in millimetres used to dimensionalize digit-root ratios. */
    palmLengthMm: number;

    /** Independent deformations applied before world placement; the wrist section remains fixed. */
    traits: {
      /** Positive scale of measurement-chart breadth away from the registration origin. */
      handBreadthScale: number;

      /** Positive scale of measurement-chart thickness away from the registration origin. */
      handDepthScale: number;

      /** Positive digit dilation about its branch root; the thumb uses its second mechanical root. */
      digitLengthScale: Record<Digit, number>;

      /** Additional web displacement in millimetres along the decoder's registered longitudinal direction. */
      webHeightOffsetMm: Record<Web, number>;
    };

    /** Owned wrist section; its actual cubic controls and full longitudinal field are published to arms. */
    wristSection: Section;

    /** Distal end of the wrist collar, deformed with palm breadth and thickness. */
    proximalPalmSection: Section;

    /** Named palm supports used by longitudinal guides between the wrist collar and digit branches. */
    palmSteering: Record<
      string,
      {
        /** Station along registration origin to the middle digit's first root. */
        fraction: number;

        /** Signed transverse u/v offsets in millimetres for the four named palm supports. */
        measures: Record<
          `${"dorsal" | "thenar" | "radialThumb" | "ulnar"}${"BreadthMm" | "DepthMm"}`,
          number
        >;
      }
    >;

    /** Independent dimensions for all five branches, using the shared construction equations. */
    digits: Record<Digit, Finger>;

    /** Junction offsets relative to adjacent mechanical-root midpoints. */
    webs: Record<
      Web,
      {
        /** Longitudinal offset divided by the mean adjacent proximal-interval length. */
        longitudinalRatio: number;

        /** Breadth offset divided by the same mean interval length. */
        breadthRatio: number;

        /** Thickness offset divided by the same mean interval length. */
        thicknessRatio: number;
      }
    >;
  }

  /** Separately supplied left and right recipes; sharing values is a caller decision.
   *
   * @author Samchon
   */
  export interface Bilateral {
    /** Left-hand dimensions resolved through leftHand. */
    left: Detailed;

    /** Right-hand dimensions resolved through rightHand with explicit local chirality. */
    right: Detailed;
  }
}
