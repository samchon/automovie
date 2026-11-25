import type { IAutoMovieHandAnthropometry } from "@automovie/interface";

/**
 * Population hand anthropometry: each digit's breadth and girth at its two
 * joints nearest the tip, and the sample's mean hand length, the table both the
 * human figure and the objects a hand takes read.
 *
 * Source: Rastgoo Balov L., Allahyari T., Jafari M., Hajaghazadeh M., "Hand
 * anthropometry, grip strength, and manual dexterity: a correlational study
 * among dental students", SAGE Open Med (2026), doi 10.1177/20503121261428206,
 * PMC13039577, Tables 1 and 2: the right hands of 51 women and 49 men, breadth
 * by digital caliper and circumference by tape at the first joint (counted from
 * the tip: the distal interphalangeal joint, the thumb's interphalangeal joint)
 * and the second (the proximal interphalangeal joint, the thumb's
 * metacarpophalangeal joint), with the hand length (means).
 *
 * Limits: a small sample of Iranian students; the joints are counted from the
 * tip as the paper's order of its measures implies (the first joint's breadth
 * is the smaller); the women's thumb breadth at its first joint carries a large
 * SD (7.90 mm), a sign of an outlier in the sample.
 */
export namespace AutoMovieHandAnthropometry {
  /**
   * Digits 1 (thumb) to 5 (little), each `[first joint, second joint]` from the
   * tip, women then men (means).
   */
  export const JOINTS: readonly [
    readonly (readonly [
      IAutoMovieHandAnthropometry.IJoint,
      IAutoMovieHandAnthropometry.IJoint,
    ])[],
    readonly (readonly [
      IAutoMovieHandAnthropometry.IJoint,
      IAutoMovieHandAnthropometry.IJoint,
    ])[],
  ] = [
    [
      [
        { breadth: 18.41, girth: 60.61 },
        { breadth: 20.07, girth: 68.52 },
      ],
      [
        { breadth: 14.09, girth: 50.09 },
        { breadth: 16.48, girth: 58.32 },
      ],
      [
        { breadth: 14.08, girth: 48.78 },
        { breadth: 16.1, girth: 59.28 },
      ],
      [
        { breadth: 13.15, girth: 46.21 },
        { breadth: 15.15, girth: 55.31 },
      ],
      [
        { breadth: 11.87, girth: 42.92 },
        { breadth: 13.41, girth: 48.49 },
      ],
    ],
    [
      [
        { breadth: 18.85, girth: 66.47 },
        { breadth: 23.56, girth: 76.71 },
      ],
      [
        { breadth: 15.34, girth: 53.58 },
        { breadth: 17.98, girth: 64.06 },
      ],
      [
        { breadth: 15.74, girth: 54.55 },
        { breadth: 17.93, girth: 64.45 },
      ],
      [
        { breadth: 14.79, girth: 51.64 },
        { breadth: 17.21, girth: 61.77 },
      ],
      [
        { breadth: 13.49, girth: 46.61 },
        { breadth: 14.99, girth: 54.3 },
      ],
    ],
  ];

  /** The sample's mean hand length, women and men, mm. */
  export const HAND_LENGTH: readonly [number, number] = [175.64, 194.98];
}
