/** Physical quantities absent from the current public identity. They must be supplied explicitly with a provenance label; no reference-gate coordinates or clinical validity are inferred.
 *
 * @author Samchon
 */
export namespace IFaceIndependentMeasurements {
  /** Missing bilateral canthal and lid-support measurements. They determine skin proxy curves, not ocular component geometry.
   *
   * @author Samchon
   */
  export interface Eye {
    /** Degrees of lateral canthal Y slope; projected X width is solved jointly with the supplied signed recession. */
    canthalSlantDegrees: number;

    /** Signed lateral-minus-medial Z displacement, mm. Its magnitude must be less than the clinical canthal chord. */
    canthalRecessionMm: number;

    /** Aperture-margin midpoint Z bulge above the canthal endpoint line, mm; a supplied support convention without globe-contact validation. */
    marginDepthBulgeMm: number;

    /** Upper-fold/lower-transition arch offset, mm; both eyes must share this value in the current family. */
    foldOffsetMm: number;

    /** Lid-roll arch offset, mm; both eyes must share this value in the current family. */
    rollOffsetMm: number;
  }

  /** Missing auricular physical scales and rotation, supplied explicitly rather than inferred from a clinical breadth label.
   *
   * @author Samchon
   */
  export interface Ear {
    /** Auricular yaw in degrees within the native transverse plane, mirrored by anatomical side. */
    rotationDegrees: number;

    /** Positive posterior-chart helix breadth, mm. Clinical ear breadth uses different endpoints: https://doi.org/10.3346/jkms.2025.40.e107. */
    helixBreadthScaleMm: number;

    /** Positive superior/inferior concha scale, mm, used by rim and cartilage courses. */
    conchaLengthMm: number;

    /** Positive posterior/anterior concha scale, mm, separate from whole helix breadth. */
    conchaBreadthMm: number;

    /** Positive outward-depth scale, mm, for concha courses; not a cavity or thickness model. */
    conchaDepthMm: number;

    /** Positive lobular height scale, mm. It allocates the cartilage height and rounded lower shoulders; the complete free edge joins the actual helix and attachment while retaining the public inferior ear-length datum. */
    lobuleLengthMm: number;
  }

  /** Explicit physical supplement beside the current public identity. No specimen-gate controls or origins are accepted. Supplied quantities remain unverified until source and viewer review.
   *
   * @author Samchon
   */
  export interface Value {
    /** Provenance label only. The conventional label does not turn geometric demonstration choices into observed anatomy. */
    qualification:
      | "caller-supplied-unverified"
      | "conventional-demonstration-v1";

    /** Independent dimensions at the generated simple mid-tube; this station is not automatically the public clinical tape station. */
    neck: {
      /** Fraction strictly between 0 and 1 locating the mid-tube between the submental upper plane (0) and actual neck root (1). */
      midPlaneFractionBelowChin: number;

      /** Positive circumference of the actual generated four-cubic mid-tube, mm; it must refer to that explicit station. */
      circumferenceAtMidTubeMm: number;

      /** Positive posterior/anterior semiaxis divided by transverse semiaxis; circumference is solved independently. */
      depthToBreadthRatio: number;

      /** Fractional semiaxis change from mid to upper tube; greater than -1 keeps upper radii positive. */
      upperRadiusFractionChange: number;
    };

    /** Independent jaw-floor, chin and cheek profile supports, mm; these are not a mandible scan or a surface fit. */
    jaw: {
      /** Positive vertical drop from actual menton to upper tube, mm; actual neck root must remain below that plane. */
      submentalDropMm: number;

      /** Positive full transverse chin support breadth, mm. */
      chinBreadthMm: number;

      /** Positive prominence height above menton, mm, below the sublabial support. */
      prominenceHeightMm: number;

      /** Signed anterior displacement of prominence from menton, mm. */
      prominenceForwardMm: number;

      /** Positive sublabial height above menton, mm, below the lower vermilion border. */
      sublabialHeightMm: number;

      /** Posterior sublabial displacement from menton Z, mm. */
      sublabialRecessionMm: number;

      /** Scale in mm of conventional quadratic front-wing/cheek depth allocation; this is not a measured tissue thickness. */
      cheekRecessionMm: number;
    };

    /** Independent nasal projections and nostril ellipse dimensions; no nasal surface or airway is implied. */
    nasal: {
      /** Posterior separation between nasion and subnasal anchor, mm; magnitude must leave a real nasal-height chord projection. */
      rootRecessionMm: number;

      /** Tip height above the subnasal anchor, mm; magnitude must leave a real nose-protrusion chord projection. */
      tipRiseMm: number;

      /** Positive full analytic nostril breadth along its lateral axis, mm. */
      nostrilBreadthMm: number;

      /** Positive full analytic nostril extent along its second plane axis, mm. */
      nostrilHeightMm: number;

      /** Degrees tilting the analytic nostril plane toward inferior Y. */
      nostrilPlaneDegrees: number;

      /** Degrees rotating the analytic nostril lateral axis toward posterior Z. */
      nostrilRecessionDegrees: number;
    };

    /** Independent vermilion projection, corner recession and philtrum breadth; the neutral contact remains zero aperture. */
    oral: {
      /** Central upper-border Z displacement from stomion, mm; magnitude must be less than the upper vermilion chord. */
      upperBorderProjectionMm: number;

      /** Central lower-border Z displacement from stomion, mm; magnitude must be less than the lower vermilion chord. */
      lowerBorderProjectionMm: number;

      /** Posterior displacement of both commissures from stomion, mm. */
      cornerRecessionMm: number;

      /** Positive X separation of bilateral Cupid/philtral supports, mm. */
      philtrumBreadthMm: number;
    };

    /** Independent bilateral canthal/depth records with shared fold/roll offsets required by the existing family. */
    eyes: {
      /** Subject-left canthal and lid-support measurements. */
      left: Eye;

      /** Subject-right canthal and lid-support measurements. */
      right: Eye;
    };

    /** Positive legacy three-slot mm tuple. Only slot 2 contributes to medial-anchor Z; slots 0/1 are retained bookkeeping and emit no ocular geometry. A population prior does not certify contact. */
    globeRadiiMm: readonly [number, number, number];

    /** Independent bilateral auricular dimensions and rotations. */
    ears: {
      /** Subject-left cartilage dimensions and chart rotation. */
      left: Ear;

      /** Subject-right cartilage dimensions and chart rotation. */
      right: Ear;
    };
  }
}
