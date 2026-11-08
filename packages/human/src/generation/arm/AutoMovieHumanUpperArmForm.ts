/**
 * Published soft-tissue thicknesses that shape the upper arm's four outlines
 * about the humerus axis between the deltoid and the elbow. Each outline's
 * skin offset is the humerus' own half extent plus the muscle and the
 * subcutaneous fat over it on that side; the bone's half extent is taken as
 * constant along the shaft, so the bone cancels from every difference used
 * here (the anterior-posterior split and the station slopes).
 *
 * - Muscle thickness, anterior (biceps and brachialis) and posterior
 *   (triceps), B-mode ultrasound from the adipose-muscle to the muscle-bone
 *   interface at 60 % of the acromion-lateral epicondyle distance from the
 *   acromion: Sanada, Kearns, Midorikawa and Abe 2006 (Eur J Appl Physiol
 *   96:24, Table 1, Japanese adults; sites of Abe et al. 1994; the direction
 *   from the acromion as Akagi et al. 2011 J Physiol Anthropol 30:169 state
 *   it).
 * - Subcutaneous fat with skin, B-mode ultrasound on the anterior (G),
 *   lateral (H), posterior (I) and medial (J) lines of the upper arm at its
 *   upper and lower third heights: Maruyama, Iizuka and Yoshida 1991 (Ann
 *   Physiol Anthropol 10:61, Table 2, Japanese young adults, women n = 66,
 *   men n = 59), read here on the acromion-lateral epicondyle length.
 * - Elbow flexor thickness distal of the 60 % site, at rest: 3.0 cm at the
 *   site and 3.4 cm 5 cm distal, read from Akagi et al. 2011 Fig. 3 at
 *   0.05 cm; still rising at the last site, so the flexors' greatest
 *   thickness lies at or past it (young men, stature 172.2 cm; their
 *   acromion-lateral epicondyle length taken as the ANSUR II men's
 *   acromion-radiale on stature, -20.9 + 0.2028 S = 328.3 mm).
 * - Lateral deltoid muscle thickness at 25 % and 40 % of the acromion-lateral
 *   epicondyle distance: 21.7 and 18.7 mm, the means of both groups' baselines
 *   (Larsen et al. 2025, Front Physiol, PMC12277279, Table 2; 16 men, 8 women).
 * - Deltoid insertion, distal end of the anterior insertion: 51 % of the
 *   greater tubercle-lateral epicondyle length above the lateral epicondyle
 *   (Huri et al. 2014, Acta Orthop Traumatol Turc 48:584, 12 arms, humeral
 *   length 271.8 mm), so 49 % of it below the greater tubercle; Morgan et al.
 *   2006 (J Orthop Trauma) measure 158 mm from the greater tuberosity, the same
 *   share of an adult humerus, and Gray 1918 the middle of the lateral humerus.
 */
export namespace AutoMovieHumanUpperArmForm {
  /** An outline side about the humerus axis. */
  export type Side = "lateral" | "medial" | "anterior" | "posterior";

  /** Share of the acromion-lateral epicondyle distance, from the acromion, where Sanada's muscle thicknesses stand. */
  export const SITE: number = 0.6;

  /** Sanada et al. 2006 Table 1 muscle thickness at {@link SITE}, mm: women n = 34, men n = 41. */
  export const MUSCLE: Readonly<Record<"female" | "male", { anterior: number; posterior: number }>> = {
    female: { anterior: 21.9, posterior: 23.4 },
    male: { anterior: 30.7, posterior: 34.1 },
  };

  /** Maruyama et al. 1991 Table 2 fat with skin at the upper arm's upper and lower third heights, mm. */
  export const FAT: Readonly<Record<"female" | "male", Readonly<Record<Side, readonly [number, number]>>>> = {
    female: { anterior: [13.54, 10.54], lateral: [7.54, 5.53], posterior: [8.7, 10.27], medial: [7.72, 9.34] },
    male: { anterior: [6.92, 5.09], lateral: [4.84, 3.11], posterior: [5.0, 4.85], medial: [3.73, 3.02] },
  };

  /** Akagi et al. 2011 Fig. 3, at rest: flexor thickness 5 cm distal of {@link SITE} over its thickness there, the span in mm and the subjects' length in mm. */
  export const FLEXOR: { readonly ratio: number; readonly span: number; readonly length: number } = { ratio: 3.4 / 3.0, span: 50, length: -20.9 + 0.2028 * 1722 };

  /** Larsen et al. 2025 lateral deltoid thickness: [share of the acromion-lateral epicondyle distance, mm] at its two sites. */
  export const DELTOID: readonly [readonly [number, number], readonly [number, number]] = [
    [0.25, 21.7],
    [0.4, 18.7],
  ];

  /** Huri et al. 2014: the deltoid insertion's distal end, share of the greater tubercle-lateral epicondyle length below the tubercle. */
  export const INSERTION: number = 1 - 0.51;

  /**
   * Fat with skin on one side at a share of the upper arm, mm: linear between
   * Maruyama's upper and lower third heights, held beyond them.
   *
   * @param female Whether the person is a woman.
   * @param side The outline side.
   * @param share Share of the acromion-lateral epicondyle length from the acromion.
   */
  export function fat(female: boolean, side: Side, share: number): number {
    const [upper, lower]: readonly [number, number] = FAT[female ? "female" : "male"][side];
    const t: number = Math.min(1, Math.max(0, (share - 1 / 3) * 3));
    return upper + t * (lower - upper);
  }

  /**
   * The anterior skin offset's excess over half the depth at {@link SITE}, mm:
   * with the depth `D = A + P`, `A` and `P` the anterior and posterior
   * offsets (fat plus muscle plus the bone's half extent), the anterior offset
   * is `D / 2 + ((fat + muscle)_A - (fat + muscle)_P) / 2`; the bone cancels.
   *
   * @param female Whether the person is a woman.
   */
  export function split(female: boolean): number {
    const m: { anterior: number; posterior: number } = MUSCLE[female ? "female" : "male"];
    return (fat(female, "anterior", SITE) + m.anterior - fat(female, "posterior", SITE) - m.posterior) / 2;
  }

  /**
   * Slope of the anterior skin offset along the walk at {@link SITE}, mm per mm:
   * the flexors' thickening (Akagi's ratio applied to Sanada's thickness over
   * Akagi's 5 cm carried onto the person's length) plus the anterior fat's
   * change between Maruyama's third heights.
   *
   * @param female Whether the person is a woman.
   * @param length The person's acromion-lateral epicondyle walk length, mm.
   */
  export function anteriorSlope(female: boolean, length: number): number {
    const thickness: number = MUSCLE[female ? "female" : "male"].anterior;
    const muscle: number = (thickness * (FLEXOR.ratio - 1)) / ((FLEXOR.span * length) / FLEXOR.length);
    return muscle + fatSlope(female, "anterior", length);
  }

  /**
   * Slope of the lateral skin offset along the walk between Larsen's deltoid
   * sites, mm per mm: the deltoid's thinning between them plus the lateral
   * fat's change between Maruyama's third heights.
   *
   * @param female Whether the person is a woman.
   * @param length The person's acromion-lateral epicondyle walk length, mm.
   */
  export function lateralSlope(female: boolean, length: number): number {
    const [[s0, t0], [s1, t1]]: readonly [readonly [number, number], readonly [number, number]] = DELTOID;
    return (t1 - t0) / ((s1 - s0) * length) + fatSlope(female, "lateral", length);
  }

  /**
   * Change of one side's fat per mm of walk between Maruyama's third heights.
   *
   * @param female Whether the person is a woman.
   * @param side The outline side.
   * @param length The person's acromion-lateral epicondyle walk length, mm.
   */
  export function fatSlope(female: boolean, side: Side, length: number): number {
    const [upper, lower]: readonly [number, number] = FAT[female ? "female" : "male"][side];
    return (lower - upper) / (length / 3);
  }
}
