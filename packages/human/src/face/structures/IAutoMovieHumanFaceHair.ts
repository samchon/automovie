/**
 * Numerical instructions for generating scalp locks on a shared facial basis.
 * The basis owns anatomical growth regions and neutral correspondence. This
 * document owns lengths, fields and appearance; it contains no strand positions,
 * images or identity-dependent resource key. Empty layers mean no scalp hair.
 * Coordinates are metres in the neutral head frame: +Y superior, +Z anterior,
 * and +X anatomical left. Fields describe static styling, not follicle biology,
 * elastic-rod dynamics, hair-to-hair contact or a biological density calibration.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Separates numerical personal differences from shared source geometry and attachments.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Stores field parameters while keeping generated curves outside authored documents.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHair {
  /** Independently generated named populations, at most eight. */
  layers: IAutoMovieHumanFaceHair.Layer[];
}

/**
 * Field types nested under the numerical hairstyle document.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Keeps personal styling within numerical documents.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Groups layer inputs without exposing generated guide coordinates.
 */
export namespace IAutoMovieHumanFaceHair {
  /**
   * One deterministic root population and its metric styling/appearance inputs.
   * Every length includes its root-to-strip transition. Sampling step is a
   * numerical accuracy setting, distinct from painted fibres and lock count.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Expresses each scalp population through shared generation rules and scalar edits.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Names the reference domain, reproducible population and independent length, flow, curl and finish fields.
   * @author Samchon
   */
  export interface Layer {
    /** Nonblank identity unique within this hairstyle, independent of a person. */
    id: string;
    /** Existing shared basis surface and its declared growth-domain identity. */
    surface: string;
    /** Named anatomical growth domain within that shared surface. */
    domain: string;
    /** Number of generated locks, integral in [0,1024]; not follicles per area. */
    count: number;
    /** Unsigned 32-bit seed; retained roots keep their original sequence identity. */
    seed: number;
    /**
     * Polar hairline angles in [0,pi] radians from +Y about the domain origin.
     * The left/right side and front/back values blend by squared azimuth weights.
     * The mask can only reduce the shared anatomical growth domain.
     */
    hairline: { front: number; left: number; right: number; back: number };
    /**
     * Optional neutral-space Gaussian root preference. Sampling retains the
     * requested count within the common domain/hairline, with relative area
     * density exp(-0.5*sum(((root-center)/spread)^2)). This localizes independent
     * populations such as a fringe; it is not a biological density estimate.
     */
    rootRegion?: IAutoMovieHumanFaceHair.Region;
    /**
     * Positive centreline lengths in metres at the six neutral chart axes,
     * ordered [+X,-X,+Y,-Y,+Z,-Z]: left, right, crown, nape, front, back.
     * Absolute radial components form nonnegative weights summing to one.
     * These are a regional length field, not six measured anatomical landmarks.
     */
    lengthAxes: [number, number, number, number, number, number];
    /** Seeded fractional length amplitude in [0,1]. */
    lengthVariation: number;
    /**
     * The guide hierarchy: `fraction` in (0,1] of the roots, chosen by their
     * own sample identity, are integrated through the fields and the surface
     * contact as guides; every other root is a strand interpolated from its
     * `neighbours` (integral in [1,8]) nearest guides on the same side of the
     * part, weighted by scalp distance against the guides' own mean spacing.
     * Optional `clump` in [0,1] gathers strands toward their nearest guide,
     * nothing at the root and that fraction of the way at the tip. Absent,
     * every root is a guide, which is the flat population.
     */
    guides?: { fraction: number; neighbours: number; clump?: number };
    /** Maximum ribbon width in metres, positive and at most 0.04. */
    width: number;
    /** Positive maximum integration step in metres, at most 0.005. */
    samplingStep: number;
    /** Nonnegative requested free-strip clearance from the skin, in metres. */
    clearance: number;
    /**
     * Nonzero dimensionless world-frame flow vector. Its magnitude sets its
     * weight relative to the optional parting field; it is not a physical force.
     */
    flow: [number, number, number];
    /** Nonnegative outward direction bias and its positive decay distance (m). */
    lift: { strength: number; reach: number };
    /**
     * Optional continuous parting field. The plane normal is normalized before
     * use and offset is signed metric distance from the neutral frame origin.
     * The tanh transition width and arc-length decay reach are positive metres.
     * A Gaussian root-space envelope optionally limits the field's influence.
     */
    part?: {
      normal: [number, number, number];
      offset: number;
      transitionWidth: number;
      /** Additional dimensionless flow bias, projected into the local tangent. */
      bias: [number, number, number];
      /** Nonnegative relative weight and positive arc-length decay distance (m). */
      strength: number;
      reach: number;
      region?: IAutoMovieHumanFaceHair.Region;
    };
    /**
     * Wave or helical direction modulation. Angle is in [0,pi/2) radians.
     * Wavelength and onset reach are positive metres of centreline arc length.
     * A wavelength needs at least eight integration intervals. Contact can
     * modify the desired curl; this does not prescribe a stress-free rod shape.
     */
    curl: {
      mode: "wave" | "helix";
      angle: number;
      wavelength: number;
      reach: number;
    };
    /** Positive tip/root width ratio in [0.05,1] and taper start fraction [0,0.95]. */
    taper: { tipWidth: number; start: number };
    /**
     * Linear RGB/roughness in [0,1] and procedural fibre appearance. Painted
     * fibres are integral in [1,32], coverage in [0.1,1], normal/shade in [0,1].
     * This generates shared-formula pixels and stores no personal bitmap.
     */
    finish: {
      color: [number, number, number];
      roughness: number;
      fibres: number;
      coverage: number;
      normal: number;
      shade: number;
    };
  }

  /**
   * Axis-aligned Gaussian envelope in the neutral head's metre coordinates.
   * Root sampling and parting use the same arithmetic but independent inputs.
   * It stores six field coefficients, never a root list or curve samples.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Describes local numerical populations without personal geometry.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Shares the meaning of spatial envelopes between sampling and styling.
   * @author Samchon
   */
  export interface Region {
    /** Finite centre coordinates in neutral head metres. */
    center: [number, number, number];
    /** Positive metre-space standard deviations, not a hard clipping radius. */
    spread: [number, number, number];
  }
}
