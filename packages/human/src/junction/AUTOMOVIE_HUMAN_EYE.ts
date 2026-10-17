/**
 * Dimensions of the human eye the eye generator builds the globe from, in millimetres unless stated.
 *
 * The adult globe barely varies with face size, sex or age: Bekerman et al. measured no significant difference by any of them, so an adult takes these values whatever the head, and a small face reads as having large eyes. A child's globe is smaller, and the generator scales it by {@link AUTOMOVIE_HUMAN_EYE.growth}.
 *
 * @author Samchon
 */
export const AUTOMOVIE_HUMAN_EYE: {
  readonly transverse: 24.24;
  readonly vertical: 23.78;
  readonly axial: 23.49;
  readonly cornealRadius: 7.64;
  readonly limbus: 11.73;
  readonly anteriorChamber: 3.03;
  readonly pupil: 4;
  readonly cornealIndex: 1.38;
  readonly growth: {
    readonly circumference: readonly [
      469,
      492,
      505,
      515,
      524,
      529,
      539,
      551,
      555,
    ];
    readonly axial: readonly [
      20.6,
      21.34,
      21.77,
      22.32,
      22.82,
      23.06,
      23.25,
      23.42,
      23.49,
    ];
  };
} = {
  /**
   * Transverse globe diameter, sclera to sclera: 24.16 and 24.32 mm right and left, medians of 250 healthy adults on CT, Israel (Bekerman, Gottlieb and Vaiman 2014, J Ophthalmol 2014:503645, Table 1). Grade: measured, both sides pooled.
   */
  transverse: 24.24,

  /** Vertical (sagittal) globe diameter: 23.80 and 23.75 mm, same study. Grade: measured. */
  vertical: 23.78,

  /**
   * Axial length of an emmetropic eye, from the corneal apex to the posterior pole: 23.42 and 23.56 mm, same study. Myopia and hypermetropia change only this diameter. Grade: measured.
   */
  axial: 23.49,

  /**
   * Radius of the anterior corneal surface: 337.5 / K for the mean keratometry K of 44.20 D, 1,015 eyes aged 50 and over, Guangzhou, IOLMaster (Chen et al. 2016, BMC Ophthalmol 16:47). Children keep it: Oke, Nihalani and VanderVeen (2023, Eur J Ophthalmol 33(6):2217-2221) measured 44.1 D at one year and 43.5 D at ten, a non-significant trend. Grade: derived.
   */
  cornealRadius: 7.64,

  /**
   * Limbus diameter, the visible iris from limbus to limbus: 12.11 and 11.83 mm in Caucasian men and women and 11.55 and 11.44 mm in Chinese men and women, 147 young adults on 3D photographs (Gao et al. 2025, Quant Imaging Med Surg 15(1):882-897). The identity carries neither sex nor population, so the four group means are pooled. Grade: derived.
   */
  limbus: 11.73,

  /**
   * Anterior chamber depth, corneal apex to the anterior lens surface, where the pupillary margin of the iris rests: 3.03 mm (Chen et al. 2016). Grade: measured.
   */
  anteriorChamber: 3.03,

  /**
   * Pupil diameter of the neutral eye, the one the iris image draws. The normal pupil changes from 8 mm to 1.5 mm with light (McDougal and Gamlin 2015, Compr Physiol 5(1):439-473); 4 mm is a lit interior. Grade: conventional.
   */
  pupil: 4,

  /**
   * Refractive index of the cornea: the anterior stroma measures 1.380 (SD 0.005) on an Abbe refractometer, the epithelium 1.401 in vivo and the posterior stroma 1.373 (Patel, Marshall and Fitzke 1995, J Refract Surg 11(2):100-105); the bulk stroma's value is taken. Grade: measured.
   */
  cornealIndex: 1.38,

  /**
   * Axial length against head circumference while the eye grows, millimetres both.
   *
   * Oke, Nihalani and VanderVeen (2023) measured median axial length rising from 20.6 mm at one year to 23.1 mm at ten in 100 children of Boston on ultrasound and optical biometry, 0.74 mm per doubling of age by logarithmic quantile regression; the curve 20.6 + 0.74 log2(age) reaches the adult {@link axial} at 15 years. The identity carries no age, and the globe grows with the neurocranium rather than the face, so each age's length is paired with the head circumference the converter gives a child of that age, the mean of its boys and girls from the WHO Child Growth Standards and the 3D Facial Norms growth means (Weinberg et al. 2016): 469 mm at one year, 492 at two, 505 at three, 515 at five, 524 at eight, 529 at ten, 539 at twelve, 551 at fourteen and 555 at fifteen. A larger head holds the adult length; a smaller one holds the one-year length, the youngest the study measured, so an infant's globe is somewhat too large. Adult women's heads near 546 mm read as fourteen, 0.3 percent short of the adult globe, and an adult head under 529 mm gets a globe up to 2 percent short. Grade: population-fitted.
   */
  growth: {
    circumference: [469, 492, 505, 515, 524, 529, 539, 551, 555],
    axial: [20.6, 21.34, 21.77, 22.32, 22.82, 23.06, 23.25, 23.42, 23.49],
  },
} as const;
