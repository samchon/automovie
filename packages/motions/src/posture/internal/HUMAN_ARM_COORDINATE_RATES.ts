/**
 * Each arm coordinate's velocity limit, coordinate units (degrees) per second,
 * in the coordinates' order (`HumanArmGeometry.DIMENSIONS`): the shoulder's
 * chart (two), the shoulder's twist, the elbow's flexion, abduction and twist,
 * the wrist's flexion, abduction and twist. A joint's limit is symmetric, as a
 * kinematic tree's velocity limit is, so each is the faster of its two
 * directions.
 *
 * The maximum joint velocities measured across 24 activities of daily living by
 * Herneth, Ganguly and Haddadin 2024 ("Functional kinematic and kinetic
 * requirements of the upper limb during activities of daily living", IROS 2024,
 * arXiv:2408.14361, CC BY-SA 4.0, Table IV, "vel max"):
 *
 * - The shoulder's internal and external rotation, 267 and 298, so 298;
 * - Elbow flexion and extension, 486 and 381, so 486;
 * - Forearm pronation and supination, the elbow's twist, 716 and 684, so 716;
 * - Wrist flexion and extension, 425 and 579, so 579;
 * - Wrist ulnar and radial deviation, its abduction, 240 and 260, so 260.
 *
 * That table has no shoulder flexion or abduction, so the chart's two swing
 * directions take the largest shoulder swing velocity reported by Williams,
 * Chapman, Pilarski, Vette and Hebert 2019 ("Gaze and Movement Assessment
 * (GaMA): Inter-site validation of a visuomotor upper limb functional
 * protocol", PLoS ONE 14(12):e0219333, CC BY 4.0, Table 4): flexion and
 * extension's 233.0 (pasta box, movement 3), over abduction and adduction's
 * 101.7. That study reports peaks as means across its participants, and no
 * individual maxima.
 *
 * The elbow's abduction and the wrist's twist do not move
 * (`DEFAULT_HUMANOID_ROM`), so they have no measured rate and no limit.
 */
export const HUMAN_ARM_COORDINATE_RATES: readonly number[] = [
  233.0,
  233.0,
  298,
  486,
  Infinity,
  716,
  579,
  260,
  Infinity,
];
