/**
 * Facial soft tissue thickness at the craniometric landmarks: the skin's
 * distance from the skull at each landmark, which sets each face part's
 * amplitude over the skull outline (the brow ridge at the mid-supraorbital
 * point, the jaw at the mid-mandibular border, the cheek at zygion, the lips
 * over the incisors).
 *
 * Source: Hona T.W.P.T. et al. and Stephan C.N., "Global facial soft tissue
 * thicknesses for craniofacial identification (2023): a review of 140 years
 * of data since Welcker's first study", Int J Legal Med 138:519-535 (2024),
 * doi 10.1007/s00414-023-03087-x, PMC10861615 (CC BY 4.0), Table 3, the adult
 * 2023 T-Table: weighted grand means over 139 studies and more than 19,500
 * adults, 227,130 measurements, at 25 landmarks ({@link DEPTH}; landmark
 * definitions after Stephan and Simpson 2008). Values are rounded to 0.5 mm
 * by the source; the SD is the weighted SD of the studies reporting one.
 *
 * Sex: the source pools both sexes; its rolling means by sex differ by under
 * 1 mm at the median landmarks and under 0.5 mm on average at the bilateral
 * ones, unadjusted for body size, so one table serves both.
 *
 * Limits: a grand mean across measurement methods (cephalograms, CT, CBCT,
 * ultrasound, MRI, needles; supine and upright), with a standard error of
 * the estimate of 1 to 7.7 mm (mean 3.5) for one person; the cheek's
 * landmarks (the second molars, mid-ramus, gonion) had not yet stabilized.
 */
export namespace AutoMovieHumanFaceTissue {
  /** A craniometric landmark of the 2023 T-Table. */
  export type Landmark =
    | "opisthocranion"
    | "vertex"
    | "glabella"
    | "nasion"
    | "midNasal"
    | "rhinion"
    | "subnasale"
    | "midPhiltrum"
    | "labraleSuperius"
    | "labraleInferius"
    | "supramentale"
    | "pogonion"
    | "gnathion"
    | "menton"
    | "midSupraorbital"
    | "midInfraorbital"
    | "alarCurvature"
    | "gonion"
    | "zygion"
    | "supraCanine"
    | "infraCanine"
    | "supraSecondMolar"
    | "infraSecondMolar"
    | "midRamus"
    | "midMandibularBorder";

  /** One landmark's thickness: the grand mean and the weighted SD, mm. */
  export interface IDepth {
    /** Total weighted mean, mm. */
    mean: number;

    /** Weighted SD of the studies reporting one, mm. */
    sd: number;
  }

  /**
   * The 2023 adult T-Table, by landmark (the source's pairs: op-op', v-v',
   * g-g', n-se', mn-mn', rhi-rhi', ss-sn', mp-mp', pr-ls', id-li', sm-sm',
   * pg-pg', gn-gn', me-me', mso-mso', mio-mio', ac-ac', go-go', zy-zy',
   * sC-sC', iC-iC', ecm2-sM2', ecm2-iM2', mr-mr', mmb-mmb').
   */
  export const DEPTH: Readonly<Record<Landmark, IDepth>> = {
    opisthocranion: { mean: 6.0, sd: 2.0 },
    vertex: { mean: 5.0, sd: 1.5 },
    glabella: { mean: 5.5, sd: 1.0 },
    nasion: { mean: 6.0, sd: 1.5 },
    midNasal: { mean: 4.5, sd: 1.5 },
    rhinion: { mean: 3.0, sd: 1.0 },
    subnasale: { mean: 13.5, sd: 3.5 },
    midPhiltrum: { mean: 11.5, sd: 2.5 },
    labraleSuperius: { mean: 12.0, sd: 3.0 },
    labraleInferius: { mean: 13.5, sd: 3.0 },
    supramentale: { mean: 11.0, sd: 2.0 },
    pogonion: { mean: 11.0, sd: 2.5 },
    gnathion: { mean: 7.5, sd: 2.5 },
    menton: { mean: 7.0, sd: 2.5 },
    midSupraorbital: { mean: 7.0, sd: 2.0 },
    midInfraorbital: { mean: 6.5, sd: 3.0 },
    alarCurvature: { mean: 10.0, sd: 3.0 },
    gonion: { mean: 12.5, sd: 6.0 },
    zygion: { mean: 7.5, sd: 3.0 },
    supraCanine: { mean: 10.5, sd: 2.5 },
    infraCanine: { mean: 11.0, sd: 2.5 },
    supraSecondMolar: { mean: 26.0, sd: 7.0 },
    infraSecondMolar: { mean: 22.0, sd: 6.5 },
    midRamus: { mean: 19.5, sd: 5.0 },
    midMandibularBorder: { mean: 11.0, sd: 4.0 },
  };

  /**
   * The soft tissue thickness at a landmark.
   *
   * @param landmark The craniometric landmark.
   * @returns Its grand-mean thickness, mm.
   */
  export function depth(landmark: Landmark): number {
    return DEPTH[landmark].mean;
  }
}
