/**
 * The eyelid margin rows read on the neutral person by the eye-region owner,
 * as generation skin samples ordered medial to lateral; each row holds both
 * corner vertices. The margin is the posterior border loop of the lid edge
 * (the visible fissure boundary in front clay and normal frames, whose corners
 * are where the upper and lower edges meet). Only the left side is listed;
 * the right is its exact mirror through the base mesh's mirror table.
 *
 * Definitions (Ju et al. 2024, Aesthetic Plast Surg 48(21):4489–4499,
 * Table 1): Ps / Pi "Point vertical to Pc at the upper/lower palpebral
 * margin on the eyelid edge"; En / Ex "The upper and lower eye edges meet at
 * the inner / outer corner of the eyes". The lid edge is a strip: the reading
 * row lies 1.8 mm (upper) and 1.4 mm (lower) behind the intermarginal strip
 * row at the lid centre.
 */
export const HUMAN_SOURCE_READ_MARGINS = {
  upper: [7769, 7768, 7772, 7767, 7766, 7765, 7748, 7747, 7749, 7750, 7751, 7752, 7753, 7754],
  lower: [7769, 7770, 7771, 7764, 11717, 7763, 7762, 7761, 7760, 7759, 7758, 7757, 11716, 7756, 7755, 7754],
  frames: "neutral person eyes, front clay and normal with margin candidates marked",
} as const;
