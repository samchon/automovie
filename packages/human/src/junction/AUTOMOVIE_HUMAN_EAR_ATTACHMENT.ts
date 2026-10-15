/**
 * The auricle's attachment to the head. Its long axis leans `inclination` behind the vertical, the superaurale-subaurale angle of 19.40 degrees in men and 17.95 in women among 200 adults aged 18 to 25 (Bahşi et al. 2023, J Craniofac Surg 34(8):e799-e803), the sexes averaged; measured. The attachment runs from in front of the helix root and the tragus, round the lobule's upper part, and back along the posterior auricular sulcus behind the concha (Gray, Anatomy of the Human Body, 1918, fig. 904): from tragion its centre lies `back` ear breadths behind and `down` ear lengths below along those axes, and its semi-axes are `along` ear lengths and `across` ear breadths. Derived from Gray's plate proportioned by the survey's means (Cho et al. 2025, J Korean Med Sci 40(22):e107).
 *
 * `shapeAutoMovieHumanRing` shapes the `ear` ring from it, and the ear generator stands the auricle at the same inclination, so the head and the ear open the same attachment.
 */
export const AUTOMOVIE_HUMAN_EAR_ATTACHMENT = {
  inclination: (18.7 * Math.PI) / 180,
  back: 0.27,
  down: 0.045,
  along: 0.305,
  across: 0.41,
} as const;
