/**
 * Teeth and centric occlusion, independent of facial vermilion shape.
 * Intercanine and first-intermolar widths name homologous dental cusp pairs;
 * they are arch measurements, not vertices or a hand-authored tooth mesh
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC4632224/). Arch depth is the
 * projected incisor midpoint to the first-molar transverse line, with the
 * occlusal-plane protocol fixed for both arches
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC6434674/). Tooth identity uses
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
  /** Maxillary arch in the fixed intercuspal reference pose. */
  maxillary?: IAutoMovieHumanFaceDentalParameters.Arch;
  /** Mandibular arch in the fixed intercuspal reference pose. */
  mandibular?: IAutoMovieHumanFaceDentalParameters.Arch;
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
   * One arch's linear dimensions at homologous cusps, in mm.
   * @author Samchon
   */
  export interface Arch {
    /** Left-to-right canine cusp-tip distance. */
    intercanineWidthMm?: number;
    /** Left-to-right first-molar mesiobuccal cusp-tip distance. */
    firstIntermolarWidthMm?: number;
    /** Central-incisor midpoint to first-molar cusp line, projected in the occlusal plane. */
    depthMm?: number;
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
    crownWidthMm?: number;
    /** Gingival-to-incisal/occlusal crown height in mm when observed. */
    crownHeightMm?: number;
  }
}
