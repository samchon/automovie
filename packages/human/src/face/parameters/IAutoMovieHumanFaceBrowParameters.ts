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
 * @evidence contracts/common.md#principled-implementation Optional named millimetre distances and a coverage fraction describe the neutral observed hair envelope, separately from numerical fibre geometry. Current observation rules keep the record but do not register all clinical limbal verticals, arch-apex acquisition, or the mature-hair coverage denominator.
 * @evidence contracts/common.md#clear-and-simple-design This type owns one brow's envelope and eyelid relationship; the anatomical BrowPair separately assigns left/right records rather than imposing symmetry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No per-hair root, drawn spline, universal study range or missing-value default is manufactured from these observations; current clinical acquisition gaps are not a rendered completion claim.
 * @evidence contracts/common.md#meaningful-documentation Fields define medial/central/lateral protocols, millimetres, frontal apex projection and coverage fraction, with population-specific research limits retained in the comment.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface declares seven observation fields and chooses no fibre-placement or measurement algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A brow observation record owns no repeated request coordination or measured-result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration allocates no hair population, images or tasks; its containing personal record owns the optional scalars.
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
