import type { IAutoMovieCurve64 as C } from "@automovie/engine";

/** Additional physical torso quantities absent from the public identity. Omitted quantities receive explicit engineering conventions in the resolver; neither a default nor caller-supplied value certifies an anatomical measuring protocol. */
export namespace IAutoMovieTorsoIdentity64 {
  /**
   * Fifteen supplement fields containing eighteen scalar quantities. Lengths use millimetres in the canonical rest measurement frame; paired tuples are subject-left, subject-right. Each field varies one physical shape trait rather than an individual control point.
   *
   * @author Samchon
   */
  export interface Independent {
    /** Exterior relaxed-rest chest breadth in millimetres; it is distinct from the public compressed/inspired caliper breadth. */
    relaxedChestBreadthMm: number;

    /** Rest-frame height in millimetres of the paired chest prominence course; defaults are geometric proxies, not a certified apex. */
    chestHeightMm: number;

    /** Rest-frame underfold proxy height in millimetres; an omitted value is not a measured inframammary fold. */
    underfoldHeightMm: number;

    /** Thorax depth in millimetres at the underfold proxy course. */
    underbustDepthMm: number;

    /** Fraction of chest depth anterior to the actual spine line, strictly between zero and one. */
    chestAnteriorFraction: number;

    /** Fraction of waist depth anterior to the actual spine line, strictly between zero and one. */
    waistAnteriorFraction: number;

    /** Distance in millimetres between the paired anterior course lanes, below the exterior chest breadth. */
    chestPeakSeparationMm: number;

    /** Subject-left/right projection in millimetres from the median toward the paired front masses; this does not specify breast volume. */
    pairedMassProjectionMm: readonly [number, number];

    /** Median posterior recess depth in millimetres relative to the paired posterior lanes. */
    spinalGrooveDepthMm: number;

    /** Superior soft-thickness amplitude in millimetres of the shoulder crest course. */
    deltoidSuperiorThicknessMm: number;

    /** Anterior shoulder/upper-sternal hollow amplitude in millimetres. */
    clavicularHollowDepthMm: number;

    /** Posterior soft-thickness amplitude in millimetres for shoulder and branch guides. */
    posteriorShoulderThicknessMm: number;

    /** Downward midpoint displacement in millimetres of the external axillary-floor branch. */
    axillaryFloorDropMm: number;

    /** Subject-left/right proximal collar breadth/depth ratios; both are strictly positive. */
    upperArmBreadthDepthRatio: readonly [number, number];

    /** Subject-left/right quarter-arm collar sizing circumferences in millimetres; the default holds the distinct relaxed mid-arm girth without a measured taper relation. */
    proximalUpperArmCircumferenceMm: readonly [number, number];
  }

  /**
   * Complete physical supplement plus its actual skeleton gauge and per-field provenance. Convention values are model assumptions, not population norms or measured T-pose skin.
   *
   * @author Samchon
   */
  export interface Resolved {
    /** Complete resolved physical supplements used by the common shape rules. */
    independent: Independent;

    /** Existing spine joint origin in canonical rest coordinates, in millimetres; generated trunk ratios are relative to this origin. */
    origin: C.Vector;

    /** Positive suprasternale-to-natural-waist length in millimetres used to dimensionalize internal ratios. */
    trunkLengthMm: number;

    /** Canonical rest height in millimetres of the existing upperChest joint; this is an internal core course, not a clinical skin armpit landmark. */
    axillaHeightMm: number;

    /** Actual trunk parent used by construction and the pelvis waist publication. */
    rootBone: "spine";

    /** Public identity fields consumed by the converter, retained for provenance rather than recomputation. */
    publicMeasurementPaths: readonly string[];

    /** Per-supplement origin and rule; a provided-physical grade records caller supply, not clinical certification. */
    provenance: Readonly<
      Record<
        keyof Independent,
        {
          /** Caller-supplied physical quantity or explicit engineering default; neither label certifies its measurement protocol. */
          grade: "provided-physical" | "engineering-convention";

          /** Human-readable default formula or caller-supplied-quantity declaration. */
          rule: string;
        }
      >
    >;
  }
}
