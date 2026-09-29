/**
 * One eyebrow's observed hair envelope and palpebral relationship.
 * A 3D periocular study measured medial, central and lateral brow-to-lid
 * distances separately (https://pmc.ncbi.nlm.nih.gov/articles/PMC11744102/).
 * A 3,600-person photographic study measured brow length, vertical breadth,
 * curvature and hair coverage, but its sample was adult women and does not
 * certify a universal range (https://pubmed.ncbi.nlm.nih.gov/31310328/).
 * A separate standardized frontal-photograph study measured the superior
 * brow-border arch apex above the border at the medial limbus in 100 women;
 * that projected height is a scalar observation, not a user-drawn spline
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC3805639/).
 * Values describe a named hair-bearing region; no per-hair root or arch curve
 * can be authored through this type.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBrowParameters {
  /** Medial to lateral extent of mature brow hair in mm. */
  lengthMm?: number;
  /** Superior-to-inferior hair-envelope breadth at the pupil's vertical, mm. */
  centralBreadthMm?: number;
  /** Medial inferior hair margin to upper lid margin on that vertical, mm. */
  medialBrowToLidMm?: number;
  /** Central inferior hair margin to upper lid margin on the pupil vertical, mm. */
  centralBrowToLidMm?: number;
  /** Lateral inferior hair margin to upper lid margin on that vertical, mm. */
  lateralBrowToLidMm?: number;
  /** Superior-border arch apex above its medial-limbus level in frontal projection, mm. */
  upperArchApexRiseMm?: number;
  /** Visible mature-hair coverage of the measured brow envelope, in [0,1]. */
  hairCoverageFraction?: number;
}
