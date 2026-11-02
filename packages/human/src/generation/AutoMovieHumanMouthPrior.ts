/**
 * Published anatomy the mouth's interior is generated from, shared by every
 * person. Lengths are millimetres of an adult; a person's own head sets where
 * they stand, never their size, because the permanent teeth vary little
 * between adults and do not grow with stature.
 *
 * - Teeth: crown dimensions of the permanent dentition from the standard table
 *   of Wheeler's Dental Anatomy (Nelson and Ash, Wheeler's Dental Anatomy,
 *   Physiology and Occlusion, 9th ed., 2010, Table 1-1), central incisor to
 *   second molar of one quadrant. Third molars are left out, as they are often
 *   absent or unerupted.
 * - Arch: teeth stand side by side along the beta-function arch of Braun et
 *   al. (1998, Angle Orthod 68:29-36), whose width is set so that the first
 *   molars' mesiobuccal cusps stand the adult intermolar width apart.
 * - Occlusion: overjet and overbite of a normal occlusion, about 2 to 3 mm
 *   each (Proffit, Contemporary Orthodontics, 6th ed., ch. 1); the occlusal
 *   plane rises backward from the Frankfort plane by Downs' mean cant (Downs
 *   1948, Am J Orthod 34:812-840).
 * - Lips over the teeth: the upper incisal edge shows below the upper lip at
 *   rest by 3.40 mm in women and 1.91 mm in men (Vig and Brundo 1978, J
 *   Prosthet Dent 39:502-504); the soft tissue over the upper incisors is
 *   about 13 to 15 mm thick at the vermilion (Holdaway 1983, Am J Orthod
 *   84:1-28).
 */
export namespace AutoMovieHumanMouthPrior {
  /** One tooth's crown, millimetres. */
  export interface ITooth {
    /** Name within its quadrant. */
    name: string;

    /** Mesiodistal crown width, along the arch. */
    width: number;

    /** Labiolingual or buccolingual crown depth, across the arch. */
    depth: number;

    /** Cervicoincisal or cervico-occlusal crown height. */
    height: number;

    /** Mesiodistal width at the cervical line, where the crown meets the gum. */
    neck: number;

    /** Kind of crown: a blade, a cusp or a table. */
    kind: "incisor" | "canine" | "premolar" | "molar";
  }

  /** Maxillary quadrant, central incisor first (Wheeler Table 1-1). */
  export const UPPER: readonly ITooth[] = [
    { name: "centralIncisor", width: 8.5, depth: 7.0, height: 10.5, neck: 7.0, kind: "incisor" },
    { name: "lateralIncisor", width: 6.5, depth: 6.0, height: 9.0, neck: 5.0, kind: "incisor" },
    { name: "canine", width: 7.5, depth: 8.0, height: 10.0, neck: 5.5, kind: "canine" },
    { name: "firstPremolar", width: 7.0, depth: 9.0, height: 8.5, neck: 5.0, kind: "premolar" },
    { name: "secondPremolar", width: 6.5, depth: 9.0, height: 8.5, neck: 5.0, kind: "premolar" },
    { name: "firstMolar", width: 10.0, depth: 11.0, height: 7.5, neck: 8.0, kind: "molar" },
    { name: "secondMolar", width: 9.0, depth: 11.0, height: 7.0, neck: 7.0, kind: "molar" },
  ];

  /** Mandibular quadrant, central incisor first (Wheeler Table 1-1). */
  export const LOWER: readonly ITooth[] = [
    { name: "centralIncisor", width: 5.0, depth: 6.0, height: 9.0, neck: 3.5, kind: "incisor" },
    { name: "lateralIncisor", width: 5.5, depth: 6.5, height: 9.5, neck: 4.0, kind: "incisor" },
    { name: "canine", width: 7.0, depth: 7.5, height: 11.0, neck: 5.5, kind: "canine" },
    { name: "firstPremolar", width: 7.0, depth: 7.5, height: 8.5, neck: 5.0, kind: "premolar" },
    { name: "secondPremolar", width: 7.0, depth: 8.0, height: 8.0, neck: 5.0, kind: "premolar" },
    { name: "firstMolar", width: 11.0, depth: 10.5, height: 7.5, neck: 9.0, kind: "molar" },
    { name: "secondMolar", width: 10.5, depth: 10.0, height: 7.0, neck: 8.0, kind: "molar" },
  ];

  /**
   * Distance between the maxillary first molars' mesiobuccal cusp tips of
   * adults, about 52 to 55 mm in the arch-width norms orthodontics uses
   * (the adult series of Bishara et al. 1997, Am J Orthod Dentofacial Orthop
   * 111:401-409, whose tables were not read here); the middle of that range.
   * The arch's intercanine width follows from it and the teeth, and the mouth
   * test reads it against the same norms' 33 to 35 mm.
   */
  export const INTERMOLAR: number = 53.5;

  /** Beta-function exponent of the arch (Braun et al. 1998). */
  export const ARCH_POWER: number = 0.8;

  /** Horizontal overlap of the upper incisors over the lower, mm. */
  export const OVERJET: number = 2.5;

  /** Vertical overlap of the upper incisors over the lower, mm. */
  export const OVERBITE: number = 2.5;

  /**
   * How far the upper buccal cusps stand outside the lower ones at the
   * molars, mm: half a molar's buccolingual depth less the overjet's share,
   * so the lower buccal cusps sit in the upper central fossae.
   */
  export const BUCCAL_OVERJET: number = 2.5;

  /** Rise of the occlusal plane backward from the Frankfort plane, degrees (Downs 1948). */
  export const OCCLUSAL_CANT: number = 9.3;

  /** Upper incisal edge below the upper lip at rest, women, mm (Vig and Brundo 1978). */
  export const DISPLAY_FEMININE: number = 3.4;

  /** Upper incisal edge below the upper lip at rest, men, mm (Vig and Brundo 1978). */
  export const DISPLAY_MASCULINE: number = 1.91;

  /** Soft tissue over the upper incisors' labial faces at the vermilion, mm (Holdaway 1983). */
  export const LIP_THICKNESS: number = 13.5;

  /**
   * Depth of the palatal vault over the first molars' cervical line, mm: a
   * convention from the 17 to 20 mm adult range commonly quoted, no single
   * study read here.
   */
  export const PALATE: number = 18.5;

  /**
   * Gum over a tooth's neck, mm: the free gingiva rises about 1 mm over the
   * cervical line and the attached gingiva some 3 to 5 mm beyond it before
   * the vestibule turns (Lindhe, Clinical Periodontology and Implant
   * Dentistry, ch. 1).
   */
  export const GINGIVA: number = 4;

  /** Clearance of the lining outside the teeth and gums, mm: the mucosa's own thickness. */
  export const MUCOSA: number = 2;
}
