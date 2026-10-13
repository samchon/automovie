/**
 * Biological scalp observations and numerical styling, with no render-card
 * count. Hair density is terminal hairs per square centimetre at named scalp
 * sites, not procedural locks; shaft diameter is micrometres, and neither is
 * inferred from a photograph merely because it is visible. A Korean study
 * observed site- and age-dependent density in 1,357 people aged 10 to 69
 * (https://pubmed.ncbi.nlm.nih.gov/24185569/). Counts differ by observation
 * method even in the same subjects (https://pubmed.ncbi.nlm.nih.gov/8103267/),
 * so no population mean becomes a universal type or renderer-card budget.
 * A Japanese hairline study measured the midfrontal point from glabella and
 * temporal hairline from the lateral canthus; its pattern labels describe the
 * observed outline, not a sex preset
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC8367035/).
 * A separate 500-person hairline-topography study identifies the median
 * occipital hairline on the neck and measures it against inion in a 20-person
 * imaging subgroup (https://pmc.ncbi.nlm.nih.gov/articles/PMC13119439/).
 * Loussouarn et al. measured curve diameter, curl index, waves and twists on
 * a 6 cm stretched sample in 2,449 people rather than assigning a renderer
 * helix or sine-wave mode to a whole ancestry
 * (https://pubmed.ncbi.nlm.nih.gov/17919196/).
 * Scalp-whorl observations distinguish number, anatomical region and rotation;
 * clockwise, counterclockwise and diffuse patterns are observed rather than
 * invented per-person guide paths
 * (https://www.sciencedirect.com/science/article/pii/S0022202X23019954;
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC7362971/).
 * Arrangement is authored hairstyle information, separate from follicle
 * anatomy. The public MetaHuman hairstyle generator combines a parting line,
 * regional orientation, bangs and downstream guide generation; its guides
 * belong to the generator rather than a personal numerical document
 * (https://dev.epicgames.com/documentation/metahuman/mh-groom-hairstyle-generator).
 *
 * @evidence contracts/common.md#principled-implementation Regional biological density/calibre, landmark hairline, shaft lengths/curl/whorls and composable styling remain distinct quantities. Current scalpHair observation rules keep them while the separate numerical hair document owns emitted geometry; no clinical density-to-lock or categorical-style lowering is supplied here.
 * @evidence contracts/common.md#clear-and-simple-design One scalp record groups biological acquisition separately from arrangement, and shared Site/Whorl/Flow types keep regional vocabulary local without exposing root paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Photographic visibility does not prove follicle density, cohort means do not become card budgets, and morphology/sex/ancestry labels supply no helix preset or per-person guide mesh.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes observation methods and styling, and members supply site, unit, stretched-sample protocol, categorical direction, absent/unbound states and unknown omissions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface runs no hair generator, biological count or styling-guide algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The observation schema owns no shared root-population evaluation or generated-guide cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type acquires no scalp images, strand buffers or grooming handles; the document owns the regional records and whorl list.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairParameters {
  /** Root-bearing scalp sites. Unknown sites are omitted, not assigned a default density. */
  biology?: {
    /** Central frontal scalp, behind the frontal hairline. */
    frontal?: IAutoMovieHumanFaceHairParameters.Site;

    /** Crown/vertex scalp, where a whorl may occur. */
    vertex?: IAutoMovieHumanFaceHairParameters.Site;

    /** Anatomical-left temple. */
    leftTemporal?: IAutoMovieHumanFaceHairParameters.Site;

    /** Anatomical-right temple. */
    rightTemporal?: IAutoMovieHumanFaceHairParameters.Site;

    /** Posterior occipital scalp, above the nape hairline. */
    occipital?: IAutoMovieHumanFaceHairParameters.Site;
  };

  /** Fixed anatomical landmarks locating the hair-bearing boundary. */
  hairline?: {
    /** Glabella to the midfrontal hairline point in mm. */
    midfrontalFromGlabellaMm?: number;

    /** Left lateral canthus to its temporal hairline in the frontal plane, mm. */
    leftTemporalFromCanthusMm?: number;

    /** Right lateral canthus to its temporal hairline in the frontal plane, mm. */
    rightTemporalFromCanthusMm?: number;

    /** Inion to median occipital hairline point under the cited imaging protocol, mm. */
    midOccipitalFromInionMm?: number;

    /** Observed midfrontal outline class, independent of age or sex. */
    outline?: "linear" | "triangular" | "round" | "m-shaped";

    /** Left temporal hairline class in the same study's four-class protocol. */
    leftTemporalOutline?:
      | "inverted-triangle"
      | "inverted-round"
      | "straight"
      | "convex";

    /** Right temporal hairline class, independently observed. */
    rightTemporalOutline?:
      | "inverted-triangle"
      | "inverted-round"
      | "straight"
      | "convex";

    /** Whether a central peak is present, independent of the broad outline. */
    centralPeak?: "present" | "absent";
  };

  /** Regionally measured shaft lengths in mm, never individual guide paths. */
  length?: {
    /** Frontal scalp current shaft length, mm. */
    frontalMm?: number;

    /** Vertex scalp current shaft length, mm. */
    vertexMm?: number;

    /** Anatomical-left temporal shaft length, mm. */
    leftTemporalMm?: number;

    /** Anatomical-right temporal shaft length, mm. */
    rightTemporalMm?: number;

    /** Occipital scalp current shaft length, mm. */
    occipitalMm?: number;
  };

  /** Observed curl morphology, separately from a renderer's wave/helix recipe. */
  curl?: {
    /** Diameter of the hair's resting curve, mm. */
    curveDiameterMm?: number;

    /** Waves counted on a 60 mm stretched shaft sample. */
    wavesPer60Mm?: number;

    /** Twists counted on the same 60 mm stretched sample. */
    twistsPer60Mm?: number;

    /** Stretched 60 mm divided by the end-to-end resting span. */
    curlIndex?: number;

    /** Eight-class empirical morphology label, not a geometry preset. */
    loussouarnClass?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  };

  /** Observed follicle-flow whorls; each entry is region and enum, never XYZ. */
  whorls?: IAutoMovieHumanFaceHairParameters.Whorl[];

  /** Composable grooming observations and choices; no root or guide paths. */
  arrangement?: {
    /** null records an intentionally unparted style; omission is unknown. */
    part?: {
      /** Anatomical side of the authored part relative to the frontal midline. */
      side: "centre" | "left" | "right";

      /** Part origin's lateral distance from the frontal midline, mm. */
      offsetMm: number;

      /** Length of the visible part posterior from its frontal origin, mm. */
      reachMm: number;
    } | null;

    /** A gathering can coexist with a part and bangs; null means unbound. */
    gather?: {
      /** Named region gathering the hair, without an individual root coordinate. */
      anchorRegion:
        | "vertex"
        | "occipital"
        | "nape"
        | "left-temporal"
        | "right-temporal";

      /** Free tail length beyond the gathered region, mm. */
      tailLengthMm: number;
    } | null;

    /** Front hair worn over the forehead, independent of hairline position. */
    bangs?: "present" | "absent";

    /** Coarse, categorical comb direction in anatomically named scalp regions. */
    flow?: {
      /** Superior scalp comb direction. */
      top?: IAutoMovieHumanFaceHairParameters.Flow;

      /** Anatomical-left side comb direction. */
      leftSide?: IAutoMovieHumanFaceHairParameters.Flow;

      /** Anatomical-right side comb direction. */
      rightSide?: IAutoMovieHumanFaceHairParameters.Flow;

      /** Posterior scalp comb direction. */
      back?: IAutoMovieHumanFaceHairParameters.Flow;
    };
  };
}

export namespace IAutoMovieHumanFaceHairParameters {
  /**
   * Regional procedural orientation, not a curve or root-level direction.
   *
   * @evidence contracts/common.md#principled-implementation Three named comb-direction choices represent regional styling without encoding a root trajectory or numerical vector.
   * @evidence contracts/common.md#clear-and-simple-design One closed Flow vocabulary serves top, left/right side and back arrangement fields.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A flow label is not a biological follicle orientation measurement or an automatically generated guide path.
   * @evidence contracts/common.md#meaningful-documentation The comment states regional procedural scope and excludes root-level geometry beyond the literal choices.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased union executes no combing or orientation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The choices define no shared guide computation or equivalence cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The union acquires no guide array, grooming task or resource.
   *
   * @author Samchon
   */
  export type Flow = "parting" | "pulled-back" | "pulled-forward";

  /**
   * One observed scalp whorl's categorical location and growth-flow pattern.
   *
   * @evidence contracts/common.md#principled-implementation A named scalp region and clockwise/counterclockwise/diffuse observation preserve categorical whorl acquisition relative to the local skin normal; no individual root position is supplied.
   * @evidence contracts/common.md#clear-and-simple-design Each whorl owns its region/pattern pair and the parent list represents multiplicity without a per-whorl geometry wrapper.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A region label does not invent an XYZ root, guide path, population default or a clinical-to-renderer flow conversion.
   * @evidence contracts/common.md#meaningful-documentation The fields identify allowed anatomical regions and the viewing direction for rotation rather than an unspecified screen-space clockwise sign.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This interface computes no whorl detection or strand flow.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A whorl record defines no repeated observation coordination or generated-root cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration owns no scalp surface or follicle buffers; the observation list owns its records without a type-level count cap.
   *
   * @author Samchon
   */
  export interface Whorl {
    /** Named scalp region, without a per-person root coordinate. */
    region:
      | "frontal"
      | "vertex"
      | "left-parietal"
      | "right-parietal"
      | "occipital";

    /** Rotation viewed toward skin along the local normal, or diffuse growth. */
    pattern: "clockwise" | "counterclockwise" | "diffuse";
  }

  /**
   * Measurements from one named scalp site, not one rendered strand.
   *
   * @evidence contracts/common.md#principled-implementation Optional terminal-shaft density, mean calibre and visible unpigmented fraction retain biological site measurements in distinct units, not an emitted lock or card count.
   * @evidence contracts/common.md#clear-and-simple-design A reusable three-field Site serves named scalp regions while the parent owns site identity and acquisition context.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing site data stays unknown; photographs, age-group means or renderer counts do not supply a universal biological density, and this number schema enforces no physical ranges itself.
   * @evidence contracts/common.md#meaningful-documentation Members state terminal classification, square-centimetre density, micrometre diameter and a visibly unpigmented fraction in [0,1].
   * @evidenceExclude contracts/performance.md#efficient-algorithms This type runs no shaft classification or site measurement algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A Site value defines no repeated imaging result or biological-population cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no imaging buffers or hair meshes; its document owns the optional scalar observations.
   *
   * @author Samchon
   */
  export interface Site {
    /** Count of terminal shafts per square centimetre. */
    terminalHairsPerCm2?: number;

    /** Mean observed terminal-shaft diameter, micrometres. */
    shaftDiameterMicrometres?: number;

    /** Fraction of visibly unpigmented shafts, in [0,1]. */
    unpigmentedFraction?: number;
  }
}
