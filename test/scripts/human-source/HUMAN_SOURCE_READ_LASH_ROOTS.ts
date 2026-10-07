/**
 * Anterior lid-edge rows read on the neutral CC0 hm08 skin by the eye-region
 * owner, ordered medial to lateral and including both row ends. These are
 * the skin's anterior turning border, where the proxy eyelash helper roots
 * lie, rather than the posterior palpebral contact margin. Only the left
 * rows are declared; the source mirror owns their right correspondence.
 *
 * The observation separated anterior, intermarginal and posterior loops in
 * opposing clay and normal views. The observed median separation from helper
 * roots is about 0.6 mm on the upper row and 1.1 mm on the lower row.
 * These source correspondences supply no clinical follicle population or
 * tissue depth, and each new generation requires performed-root observation.
 */
export const HUMAN_SOURCE_READ_LASH_ROOTS = {
  upper: [6850, 6847, 6886, 6844, 6841, 6838, 6785, 6784, 6790, 6793, 6796, 6799, 6802, 6805],
  lower: [6850, 6853, 6856, 6837, 11695, 6834, 6831, 6828, 6825, 6820, 6817, 6814, 11693, 6811, 6808, 6805],
  frames: "neutral person anterior lid-edge borders, left front, side, oblique, below, above, medial and lateral; right front, below and medial, clay and normal with candidates marked",
} as const;
