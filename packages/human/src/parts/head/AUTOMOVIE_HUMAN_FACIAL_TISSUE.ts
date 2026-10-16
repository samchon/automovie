/**
 * Facial soft-tissue depth over the skull at the craniometric sites the head's relief terms sit on, millimetres: the depth of a lean young adult and its gain from lean to overweight.
 *
 * Measured on CT perpendicular to the bone in 49 adults aged 18 to 25 of the Azerbaijani population, sexes pooled, split at a body mass index of 25 (Sultanova, Bayramov and Maharammova 2026, PLoS One 21(6):e0348124, Table 11: 28 people under 25 and 5 at 25 or over; bilateral sites averaged over both sides). `lean` is the mean under 25 and `gain` the difference to the mean at 25 or over. Grade: measured; the sample at 25 or over is small, so the gains are indicative.
 *
 * Within the young group the sexes differed significantly only over the lower midface and the nasion (Table 5), and women's infraorbital depth exceeded men's, so the table carries no sex term; the identity's body composition moves each depth between `lean` and `lean + gain`.
 */
export const AUTOMOVIE_HUMAN_FACIAL_TISSUE = {
  /** Over the superciliary arch, the brow ridge. */
  supraorbital: { lean: 5.96, gain: 1.94 },

  /** Under the orbit's lower rim, the lower lid's junction with the cheek. */
  infraorbital: { lean: 4.24, gain: 1.2 },

  /** Over zygion, the zygomatic arch and the zygoma's body. */
  zygion: { lean: 8.99, gain: 3.95 },

  /** Over gonion, the mandible's angle under the masseter. */
  gonion: { lean: 11.93, gain: 5.41 },

  /** Over the frontal eminence, the forehead and the temples beside it. */
  frontal: { lean: 3.82, gain: 1.63 },

  /** Over pogonion, the chin. */
  pogonion: { lean: 10.59, gain: 3.13 },
} as const;
