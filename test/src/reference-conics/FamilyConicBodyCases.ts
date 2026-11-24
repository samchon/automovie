/**
 * The cases of the body's one test round as a table: which input each case moves, by how much and what it holds, for the round's tool
 * to resolve into native fields once the sites carry their girths and four reaches.
 *
 * Every paired part is made once on the left and mirrored, so a case names a part's site once and no case is right-sided.
 *
 * A site case moves one measure of one site to its population's 5th and 95th percentile, `1 -+ 1.645 CV`, with `CV` the coefficient of
 * variation of the matching ANSUR II women's measure (`packages/human/docs/sources/ansur-ii.md`, SD over mean; the trunk's four are the
 * existing case-table values). Where the survey has no measure of the site's own definition the nearest one is
 * taken and the row says so. A breadth or a depth case takes its site's girth's `CV`, since the notes hold SDs for the hip's breadth and
 * depth only. These sizes are the cases' reach, not acceptance limits.
 */
export namespace FamilyConicBodyCases {
  /** What a case moves. */
  export type Kind = "baseline" | "girth" | "breadth" | "depth" | "tissue" | "bust" | "length";

  /** One case of the round. */
  export interface ICase {
    /** The case's identifier, the name of its folder in the round. */
    id: string;

    /** What it moves. */
    kind: Kind;

    /** The site it acts on (the resolver's named material site), or null for a case of the whole figure. */
    site: string | null;

    /** The ratio of the moved measure to the baseline. */
    ratio: number;

    /** What stays at the baseline while it moves, in words the resolving tool maps to fields. */
    holds: string;

    /** The basis of the ratio. */
    basis: string;
  }

  /** A site with the population spread of its girth. */
  interface ISite {
    /** The site's key. */
    site: string;

    /** The coefficient of variation of its girth among ANSUR II women. */
    cv: number;

    /** The survey measure the coefficient is taken from. */
    basis: string;
  }

  /** The 5th and 95th percentile of a normal measure, in standard deviations. */
  const PERCENTILE: number = 1.645;

  /** The sites below the head with their girths' spread. */
  const SITES: readonly ISite[] = [
    { site: "hip", cv: 0.0622, basis: "buttock circumference" },
    { site: "omphalion", cv: 0.1045, basis: "waist (omphalion) circumference" },
    { site: "underbust", cv: 0.0662, basis: "chest circumference below the bust (ANSUR 1988)" },
    { site: "neck", cv: 0.0484, basis: "neck circumference" },
    { site: "upperArm", cv: 30.8 / 305.6, basis: "biceps circumference, flexed: the survey has no relaxed upper arm girth" },
    { site: "elbow", cv: 18.5 / 264.1, basis: "forearm circumference, flexed: the survey has no elbow girth" },
    { site: "forearm", cv: 18.5 / 264.1, basis: "forearm circumference, flexed" },
    { site: "wrist", cv: 7.8 / 154.8, basis: "wrist circumference over stylion" },
    { site: "hand", cv: 3.8 / 78.2, basis: "hand breadth: the note holds no hand circumference's SD" },
    { site: "thigh", cv: 55.8 / 616.1, basis: "thigh circumference at the gluteal furrow" },
    { site: "knee", cv: 35.2 / 400.7, basis: "lower thigh circumference: the survey has no knee girth" },
    { site: "calf", cv: 28.5 / 373.3, basis: "calf circumference" },
    { site: "ankle", cv: 14.9 / 215.7, basis: "ankle circumference" },
    { site: "foot", cv: 4.8 / 92.7, basis: "foot breadth: the note holds no ball of foot circumference's SD" },
  ];

  /** The existing case-table spread for chest circumference at the bust point. */
  const BUST_CV: number = 0.07;

  /** Covered anatomical length changes, including breadth controls for hand and foot. */
  export const LENGTHS = ["upperArm", "forearm", "thigh", "shank", "handLength", "handBreadth", "footLength", "footBreadth", "phalanges", "limbs"] as const;

  /** One of the round's exact length changes. */
  export type Length = (typeof LENGTHS)[number];

  /** The twenty requested length changes, identified by the dimension and ratio. */
  export const LENGTH_CASES: readonly { id: string; field: Length; ratio: number }[] =
    LENGTHS.flatMap((field: Length) => [0.9, 1.1].map((ratio: number) => ({
      id: `length-${field}-${ratio}`,
      field,
      ratio,
    })));

  /** The ratio's text in an identifier: three decimals. */
  const text = (ratio: number): string => ratio.toFixed(3);

  /** Every case of the round, baseline first. */
  export const CASES: readonly ICase[] = [
    { id: "baseline", kind: "baseline", site: null, ratio: 1, holds: "everything", basis: "the supplied original fields" },
    ...SITES.flatMap((entry: ISite): ICase[] =>
      [-1, 1].flatMap((sign: number): ICase[] => {
        const ratio: number = 1 + sign * PERCENTILE * entry.cv;
        const basis: string = "1 " + (sign < 0 ? "-" : "+") + " 1.645 CV of ANSUR II women's " + entry.basis;
        return [
          { id: "site-" + entry.site + "-girth-" + text(ratio), kind: "girth", site: entry.site, ratio, holds: "the site's breadth and depth; every other site", basis },
          { id: "site-" + entry.site + "-breadth-" + text(ratio), kind: "breadth", site: entry.site, ratio, holds: "the site's depth; its fullness, so its girth follows; every other site", basis },
          { id: "site-" + entry.site + "-depth-" + text(ratio), kind: "depth", site: entry.site, ratio, holds: "the site's breadth; its fullness, so its girth follows; every other site", basis },
        ];
      }),
    ),
    ...[-1, 1].map((sign: number): ICase => {
      const ratio: number = 1 + sign * PERCENTILE * BUST_CV;
      return { id: "bust-girth-" + text(ratio), kind: "bust", site: "bust", ratio, holds: "the under-bust girth, the chest wall, the bust point's breadth and both heights", basis: "1 " + (sign < 0 ? "-" : "+") + " 1.645 CV of ANSUR II women's chest circumference at the bust point" };
    }),
    ...[0.8, 1.2].map((ratio: number): ICase => ({ id: "tissue-" + ratio, kind: "tissue", site: null, ratio, holds: "every joint centre, every bony breadth and every centre line", basis: "the native round's own tissue cases" })),
    ...LENGTH_CASES.map(({ id, ratio }): ICase => ({ id, kind: "length", site: null, ratio, holds: "every caliper and girth; the soles on the floor", basis: "the round's prescribed length ratios" })),
  ];
}
