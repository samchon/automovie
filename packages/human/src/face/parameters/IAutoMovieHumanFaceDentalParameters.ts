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
 * @evidence contracts/common.md#principled-implementation A required dentition stage, separately owned maxillary/mandibular cast records and partial ISO-coded tooth observations preserve distinct acquisition quantities. Current admission supports permanent erupted dentition only; the registry reads incisal offsets but reports unregistered arch/palate/tooth protocol gaps without shape channels.
 * @evidence contracts/common.md#clear-and-simple-design Arch measurements and per-tooth observations share one dental record while external lips and jaw-reference coupling remain their separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing tooth entries stay unknown; adult teeth do not proxy primary/mixed/edentulous stages, and three crown dimensions do not author a free tooth mesh or establish clinical eruption from an emitted crown.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes cast/scan protocols, stage and unknown teeth, acquisition beyond a portrait and exact landmark choices; fields state signed incisal millimetres and coded individual observations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This dental schema executes no arch measurement, tooth registration or occlusion algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no repeated clinical acquisition coordinator or shared dental result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no cast, scan, tooth mesh or task; the document owns its partial observation records.
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
   *
   * @evidence contracts/common.md#principled-implementation Distinct permanent/primary canine and molar landmarks and the first-molar-CEJ palatal vault retain named maxillary cast quantities in millimetres; current permanent-basis registry reports missing cusp/palate registration and admits no primary-stage measurement.
   * @evidence contracts/common.md#clear-and-simple-design One maxillary owner groups only upper-arch and palatal quantities instead of duplicating mandibular facial-axis depth.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A dentition-stage label does not prove its named teeth are present, and a maxillary/cusp-tip depth is not invented from the separate mandibular protocol.
   * @evidence contracts/common.md#meaningful-documentation Each member identifies the exact cusp/fossa or cementoenamel-junction landmarks, units and required observed teeth.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no cusp search or palatal reconstruction.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Upper-arch observations define no shared measurement evaluation or cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type retains no cast/CBCT data or mesh resource; optional scalar observations belong to the document.
   *
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
   *
   * @evidence contracts/common.md#principled-implementation Lower-arch cusp widths, primary molar fossae, permanent buccal grooves and facial-axis depth retain their distinct landmarks rather than a common generic width/depth pair; current registry reports missing permanent registration and rejects unsupported primary stage.
   * @evidence contracts/common.md#clear-and-simple-design This owner groups mandibular cast quantities separately from maxillary vault measurements and reuses no invented upper/lower symmetry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cusp tips do not replace buccal grooves or facial-axis lines, and primary second molars do not become permanent first-molar measurements.
   * @evidence contracts/common.md#meaningful-documentation Fields state exact landmark choices, groove ambiguity convention and perpendicular cast-plane depth in millimetres.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record selects no cast-plane measurement or dental fitting algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The mandibular type owns no repeated acquisition or cached arch result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No cast image or dental buffer is acquired by the declaration; its document owns the optional values.
   *
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
   *
   * @evidence contracts/common.md#principled-implementation Template-literal products represent permanent quadrants 1 through 4 with positions 1 through 8 and primary quadrants 5 through 8 with positions 1 through 5, preserving the two-digit designation rather than a mesh index.
   * @evidence contracts/common.md#clear-and-simple-design One closed key vocabulary serves the partial per-tooth record without a separate runtime identity wrapper.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A code identifies a possible dental position, not eruption, residency in the basis or a generated crown; arbitrary strings are excluded structurally.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes permanent/primary two-digit identity from free names, with the protocol source retained in the containing dental declaration.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased key union performs no tooth lookup or enumeration at runtime.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Literal tooth identity defines no measured-result cache or acquisition equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The union acquires no dental asset, code table handle or retained task.
   *
   * @author Samchon
   */
  export type ToothCode =
    | `${1 | 2 | 3 | 4}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`
    | `${5 | 6 | 7 | 8}${1 | 2 | 3 | 4 | 5}`;

  /**
   * One homologous tooth's observation, without a crown mesh or root pose.
   *
   * @evidence contracts/common.md#principled-implementation An explicit observed state and independently optional crown maxima/height retain a coded tooth's clinical record; current basis admission supports erupted only, and the registry exposes missing tooth registration or crown-axis rules rather than fabricated measurements.
   * @evidence contracts/common.md#clear-and-simple-design One Tooth value belongs to an external ToothCode key, avoiding duplicated identity or free per-tooth geometry inside the observation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted dimensions remain unknown and three numbers do not infer a crown surface, root pose, clinical absence or prosthetic realization.
   * @evidence contracts/common.md#meaningful-documentation Fields identify observed state, mesiodistal/buccolingual maxima, their perpendicular relationship and gingival-to-incisal/occlusal height in millimetres.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This interface runs no crown measurement or mesh-generation strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work One tooth record coordinates no repeated scan evaluation or shared fitting result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration allocates no crown or scan buffer; document ownership bounds the actual partial records.
   *
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
