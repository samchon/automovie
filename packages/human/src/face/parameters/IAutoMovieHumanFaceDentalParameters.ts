/**
 * Teeth and centric occlusion, independent of facial vermilion shape.
 * Intercanine and first-molar widths are dental-cast measurements, not
 * vertices or a hand-authored tooth mesh. The cited study uses canine cusp
 * tips in both arches, maxillary first-molar mesiobuccal cusp tips, and
 * mandibular first-molar buccal grooves; these are distinct protocols
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC4632224/). The cited arch-depth
 * study measures mandibular casts from central-incisor facial-axis points to
 * first-molar facial-axis points, perpendicular to their transverse line;
 * it does not establish a matching maxillary or cusp-tip depth
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC6434674/).
 * A CBCT study separately measures hard-palate width and depth in the
 * first-molar coronal plane at the cementoenamel junction; these describe
 * the palatal vault rather than arbitrary oral-wall offsets
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC11916223/). Primary-dentition
 * casts instead use primary canine cusp tips and second primary-molar central
 * fossae; these are separately named rather than passed off as permanent
 * first-molar measurements (https://pubmed.ncbi.nlm.nih.gov/19251244/).
 * Individual crown mesiodistal and buccolingual maxima and clinical height
 * are measured on permanent dental casts or intraoral scans; these three
 * dimensions do not specify a free crown surface
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC8853791/;
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC10260306/).
 * Tooth identity uses
 * the ISO 3950:2016 two-digit system, whose published description designates
 * teeth and oral regions (https://www.iso.org/standard/68292.html); the FDI's
 * educational chart shows the permanent and primary quadrants
 * (https://www.fdiworlddental.org/sites/default/files/2021-11/Participant_NOHP_EDU_Digital.pdf). Primary,
 * mixed and permanent dentition are different biological states, so missing
 * tooth entries are unknown, never silently erupted or absent. A complete
 * internal dental assessment requires intraoral observation beyond one face
 * photograph.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceDentalParameters {
  /** Primary, mixed, permanent or absent natural dentition at reference pose. */
  stage: "primary" | "mixed" | "permanent" | "edentulous";
  /** Maxillary dental cast in the declared jaw reference state. */
  maxillary?: IAutoMovieHumanFaceDentalParameters.MaxillaryArch;
  /** Mandibular dental cast in the declared jaw reference state. */
  mandibular?: IAutoMovieHumanFaceDentalParameters.MandibularArch;
  /** Upper-incisor edge anterior to lower-incisor edge, signed mm. */
  overjetMm?: number;
  /** Upper-incisor edge inferior to lower-incisor edge, signed mm. */
  overbiteMm?: number;
  /** Individually observed teeth; unlisted ISO positions remain unknown. */
  teeth?: Partial<
    Record<
      IAutoMovieHumanFaceDentalParameters.ToothCode,
      IAutoMovieHumanFaceDentalParameters.Tooth
    >
  >;
}

export namespace IAutoMovieHumanFaceDentalParameters {
  /**
   * Maxillary dental-cast measurements, in mm. A field needs its named teeth
   * actually present; tooth stage alone does not guarantee their eruption.
   * @author Samchon
   */
  export interface MaxillaryArch {
    /** Left-to-right permanent canine cusp-tip distance. */
    intercanineCuspWidthMm?: number;
    /** Left-to-right primary canine cusp-tip distance. */
    primaryIntercanineCuspWidthMm?: number;
    /** Left-to-right first-molar mesiobuccal cusp-tip distance. */
    firstMolarMesiobuccalCuspWidthMm?: number;
    /** Left-to-right primary second-molar central-fossa distance. */
    primarySecondMolarCentralFossaWidthMm?: number;
    /** Hard-palate coronal width at first-molar cementoenamel-junction level, mm. */
    palatalVaultWidthAtFirstMolarCejMm?: number;
    /** Hard-palate vault depth from that first-molar CEJ transverse level, mm. */
    palatalVaultDepthAtFirstMolarCejMm?: number;
  }

  /**
   * Mandibular dental-cast measurements, in mm. Width and depth
   * come from different studies and must retain their respective landmarks.
   * @author Samchon
   */
  export interface MandibularArch {
    /** Left-to-right permanent canine cusp-tip distance. */
    intercanineCuspWidthMm?: number;
    /** Left-to-right primary canine cusp-tip distance. */
    primaryIntercanineCuspWidthMm?: number;
    /** First-molar buccal grooves at their gingival ends, or mid-buccal if indistinct. */
    firstMolarBuccalGrooveWidthMm?: number;
    /** Left-to-right primary second-molar central-fossa distance. */
    primarySecondMolarCentralFossaWidthMm?: number;
    /** Incisor to first-molar facial-axis lines, perpendicular cast-plane distance. */
    firstMolarFacialAxisDepthMm?: number;
  }

  /**
   * Two-digit permanent or primary tooth code; no free identity string.
   */
  export type ToothCode =
    | `${1 | 2 | 3 | 4}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`
    | `${5 | 6 | 7 | 8}${1 | 2 | 3 | 4 | 5}`;

  /**
   * One homologous tooth's observation, without a crown mesh or root pose.
   * @author Samchon
   */
  export interface Tooth {
    /** Present, not yet erupted, absent, or replaced at the coded position. */
    state: "erupted" | "unerupted" | "absent" | "prosthetic";
    /** Mesial-to-distal maximum crown width in mm when a crown is observed. */
    mesiodistalCrownWidthMm?: number;
    /** Buccal-to-lingual maximum crown width perpendicular to mesiodistal, mm. */
    buccolingualCrownWidthMm?: number;
    /** Gingival-to-incisal/occlusal crown height in mm when observed. */
    crownHeightMm?: number;
  }
}
