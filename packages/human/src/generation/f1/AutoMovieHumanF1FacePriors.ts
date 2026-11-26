/**
 * Published measures the face's centres and dividing surfaces are placed by where a person's own measure is not an input, millimetres
 * and degrees. Each is a fact of a population, with the source it was read in and how much of the source was read; none is read off
 * the reference figure. `packages/human/docs/techniques/face-one-shot.md` holds the design they serve.
 *
 * A prior whose source was seen only as an abstract or a snippet is marked provisional in its comment and is replaced when the paper is
 * read. Measures no source gave (the lid margin's radius, the nostril rim's thickness, the rounded ends of an opening) are absent here
 * and unresolved in the design.
 */
export namespace AutoMovieHumanF1FacePriors {
  /**
   * Soft tissue over the upper and the lower incisors at the lips' margins: prosthion to labrale superius 12.0 mm (n 14,894) and
   * infradentale to labrale inferius 13.5 mm (n 14,425), adults pooled over sex and ancestry. Hona and Stephan 2024, Global facial soft
   * tissue thicknesses for craniofacial identification, Int J Legal Med (full text read). Their mean places the incisors' front behind
   * stomion.
   */
  export const LIP_MARGIN_TISSUE_MM: number = (12.0 + 13.5) / 2;

  /**
   * The modiolus's place from the mouth's angle: 14.4 mm lateral and 1.6 mm below the level through it, young living Koreans.
   * Provisional: read as a search snippet of the study only.
   */
  export const MODIOLUS_LATERAL_MM: number = 14.4;

  /** The modiolus below the mouth's angle, mm; provisional as `MODIOLUS_LATERAL_MM`. */
  export const MODIOLUS_BELOW_MM: number = 1.6;

  /**
   * The bony orbit's breadth and height at its margin: 40.5 and 37.3 mm, white South African women (n 55, cone beam CT, the mean of both
   * sides rounded to 0.1). Van der Walt and Oettle 2025 (full text read, first part). The orbit's dividing surface takes half of each.
   */
  export const ORBIT_BREADTH_MM: number = 40.5;

  /** The bony orbit's height, mm; as `ORBIT_BREADTH_MM`. */
  export const ORBIT_HEIGHT_MM: number = 37.3;

  /** The globe's axial length: 23.4 mm, the mean of 23.50 and 23.27 (left and right), the same sample and source as `ORBIT_BREADTH_MM`. */
  export const GLOBE_AXIAL_MM: number = 23.4;

  /**
   * Hertel exophthalmometry, the corneal apex ahead of the lateral orbital rim in primary gaze: 15.4 mm in white women, upper limit of
   * normal 20.1 (n 681 adults of both sexes and two ancestries). Migliori and Gladstone 1984 (abstract read; the definition from EyeWiki,
   * read in full).
   */
  export const HERTEL_MM: number = 15.4;

  /** Interpupillary breadth: 61.7 mm, SD 3.6, ANSUR II women (n 1,986), computed from the public table. */
  export const INTERPUPILLARY_MM: number = 61.7;

  /**
   * The sulcus under the lower lip behind the line from labrale inferius to soft pogonion: 4 mm, SD 2 (20 white men and 20 white women).
   * Legan and Burstone 1980 as quoted by Naini et al. 2017 (the latter read in full).
   */
  export const LABIOMENTAL_DEPTH_MM: number = 4;

  /**
   * The lid margin's thickness from the skin's edge to the mucosa's, adults: 1.95 mm, SD 0.07, on the upper lid and 1.87, SD 0.06, on the
   * lower. Hykin and Bron 1992 as quoted by Zhu et al. 2022 (the latter read in full; its own slit lamp reading of the keratinized
   * surface alone is 1.36 and 1.00 mm in 56 Chinese adults). The fissure's cutter takes it as the depth of the margin's face.
   */
  export const LID_MARGIN_UPPER_MM: number = 1.95;

  /** The lower lid margin's thickness, mm; as `LID_MARGIN_UPPER_MM`. */
  export const LID_MARGIN_LOWER_MM: number = 1.87;

  /**
   * The whole upper lid's thickness at the middle of the tarsus in primary gaze: 1.61 mm, SD 0.21, of which the tarsus 0.91 (50 MHz
   * ultrasound biomicroscopy, 19 Indian adults, PMC5859591, read). The lid's sheet stands this far off the globe.
   */
  export const UPPER_LID_MM: number = 1.61;

  /**
   * The alar wall's thickness by caliper: 3.45 mm, SD 0.66, in women and 3.99, SD 0.69, in men (50 of each, Turkish). Ozkul et al. 2013
   * (abstract read). Half of it bounds the nostril rim's fold radius.
   */
  export const ALAR_WALL_FEMALE_MM: number = 3.45;

  /** The alar wall's thickness in men, mm; as `ALAR_WALL_FEMALE_MM`. */
  export const ALAR_WALL_MALE_MM: number = 3.99;

  /**
   * Beyron's arbitrary hinge point of the mandible: 13 mm ahead of the tragus's posterior margin on the line from the tragus's centre to
   * the outer canthus, as two open papers quote the definition (PMC11566610, PMC10502393, read).
   */
  export const BEYRON_MM: number = 13;

  /**
   * The mandible's rotation at full opening: 24.3 degrees, SD 4.2, by the finite helical axis in asymptomatic subjects, the axis never
   * inside the condyle. Provisional: read as a search snippet.
   */
  export const JAW_OPENING_DEG: number = 24.3;
}
