import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";

/**
 * Each digit's breadth and girth at its two joints nearest the tip: the
 * digit's front-view outline and its tape at the knots the digit walk turns
 * at.
 *
 * Source: Rastgoo Balov L., Allahyari T., Jafari M., Hajaghazadeh M., "Hand
 * anthropometry, grip strength, and manual dexterity: a correlational study
 * among dental students", SAGE Open Med (2026), doi 10.1177/20503121261428206,
 * PMC13039577, Tables 1 and 2: the right hands of 51 women and 49 men,
 * breadth by digital caliper and circumference by tape at the first joint
 * (counted from the tip: the distal interphalangeal joint, the thumb's
 * interphalangeal joint) and the second (the proximal interphalangeal joint,
 * the thumb's metacarpophalangeal joint), with the hand length (means,
 * {@link JOINTS}, {@link HAND_LENGTH}).
 *
 * Derivation: the person's digits scale with their hand length over the
 * sample's mean hand length. A joint's depth is not published; its box's
 * range (`AutoMovieHumanBodyBox.range`) bounds it from the breadth and girth,
 * between `girth / 2 - breadth` and `sqrt(girth^2 / 4 - breadth^2)`.
 *
 * Limits: a small sample of Iranian students; the joints are counted from the
 * tip as the paper's order of its measures implies (the first joint's breadth
 * is the smaller); the women's thumb breadth at its first joint carries a
 * large SD (7.90 mm), a sign of an outlier in the sample.
 */
export namespace AutoMovieHumanDigitJoints {
  /** One joint's caliper breadth and tape girth, mm. */
  export interface IJoint {
    /** Breadth across the joint, mm. */
    breadth: number;

    /** Circumference round the joint, mm. */
    girth: number;
  }

  /**
   * Digits 1 (thumb) to 5 (little), each `[first joint, second joint]` from
   * the tip, women then men (means).
   */
  export const JOINTS: readonly [readonly (readonly [IJoint, IJoint])[], readonly (readonly [IJoint, IJoint])[]] = [
    [
      [{ breadth: 18.41, girth: 60.61 }, { breadth: 20.07, girth: 68.52 }],
      [{ breadth: 14.09, girth: 50.09 }, { breadth: 16.48, girth: 58.32 }],
      [{ breadth: 14.08, girth: 48.78 }, { breadth: 16.1, girth: 59.28 }],
      [{ breadth: 13.15, girth: 46.21 }, { breadth: 15.15, girth: 55.31 }],
      [{ breadth: 11.87, girth: 42.92 }, { breadth: 13.41, girth: 48.49 }],
    ],
    [
      [{ breadth: 18.85, girth: 66.47 }, { breadth: 23.56, girth: 76.71 }],
      [{ breadth: 15.34, girth: 53.58 }, { breadth: 17.98, girth: 64.06 }],
      [{ breadth: 15.74, girth: 54.55 }, { breadth: 17.93, girth: 64.45 }],
      [{ breadth: 14.79, girth: 51.64 }, { breadth: 17.21, girth: 61.77 }],
      [{ breadth: 13.49, girth: 46.61 }, { breadth: 14.99, girth: 54.3 }],
    ],
  ];

  /** The sample's mean hand length, women and men, mm. */
  export const HAND_LENGTH: readonly [number, number] = [175.64, 194.98];

  /**
   * A digit's joint, scaled to the person's hand.
   *
   * @param sex The person's sex.
   * @param handLength The person's hand length, mm.
   * @param digit 1 (thumb) to 5 (little).
   * @param joint 1, the joint nearest the tip, or 2, the next.
   * @returns The joint's breadth and girth, mm.
   */
  export function at(sex: AutoMovieHumanSex, handLength: number, digit: 1 | 2 | 3 | 4 | 5, joint: 1 | 2): IJoint {
    const k: 0 | 1 = sex === AutoMovieHumanSex.Female ? 0 : 1;
    const scale: number = handLength / HAND_LENGTH[k];
    const read: IJoint = JOINTS[k][digit - 1]![joint - 1]!;
    return { breadth: scale * read.breadth, girth: scale * read.girth };
  }
}
