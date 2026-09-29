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
 * Loussouarn et al. measured curve diameter, curl index, waves and twists on
 * a 6 cm stretched sample in 2,449 people rather than assigning a renderer
 * helix or sine-wave mode to a whole ancestry
 * (https://pubmed.ncbi.nlm.nih.gov/17919196/).
 * Arrangement is an authored hairstyle category and measured part/tail
 * length, not follicle anatomy. A procedural groom may derive guides from
 * such inputs before generating strands and hair cards
 * (https://dev.epicgames.com/documentation/metahuman/mh-groom-hairstyle-generator).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairParameters {
  /** Root-bearing scalp sites. Unknown sites are omitted, not assigned a default density. */
  biology?: {
    frontal?: IAutoMovieHumanFaceHairParameters.Site;
    vertex?: IAutoMovieHumanFaceHairParameters.Site;
    leftTemporal?: IAutoMovieHumanFaceHairParameters.Site;
    rightTemporal?: IAutoMovieHumanFaceHairParameters.Site;
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
    /** Observed midfrontal outline class, independent of age or sex. */
    outline?: "rounded" | "straight" | "triangular" | "m-shaped";
    /** Whether a central peak is present, independent of the broad outline. */
    centralPeak?: "present" | "absent";
  };
  /** Regionally measured shaft lengths in mm, never individual guide paths. */
  length?: {
    frontalMm?: number;
    vertexMm?: number;
    leftTemporalMm?: number;
    rightTemporalMm?: number;
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
  /** Static grooming topology. Every option remains scalar/enum authored. */
  arrangement?:
    | { kind: "free" }
    | {
        kind: "parted";
        side: "centre" | "left" | "right";
        /** Part origin's lateral distance from the frontal midline, mm. */
        offsetMm: number;
        /** Length of the visible part posterior from its frontal origin, mm. */
        reachMm: number;
      }
    | {
        kind: "gathered";
        anchorRegion: "vertex" | "occipital" | "nape" | "left-temporal" | "right-temporal";
        /** Tail length after the tie, in mm. */
        tailLengthMm: number;
      };
}

export namespace IAutoMovieHumanFaceHairParameters {
  /**
   * Measurements from one named scalp site, not one rendered strand.
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
