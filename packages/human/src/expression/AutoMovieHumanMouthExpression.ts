import type { IAutoMovieHumanExpression } from "../structures/expression/IAutoMovieHumanExpression";
import type { IAutoMovieHumanLipExpression } from "../structures/expression/IAutoMovieHumanLipExpression";
import type { IAutoMovieHumanTongueExpression } from "../structures/expression/IAutoMovieHumanTongueExpression";
import type { IAutoMovieHumanVisemeWeights } from "../structures/expression/IAutoMovieHumanVisemeWeights";

/**
 * A facial expression's mouth as the channels the mouth's deformation reads:
 * lip units per side, tongue controls and the jaw's opening.
 *
 * Three descriptions sum, each clamped to its range at the end: the FACS units
 * of `IAutoMovieHumanExpression.units`, the named lip and tongue fields, and
 * the visemes, each of which stands for the articulation of its sounds by the
 * places of articulation of phonetics (Ladefoged and Johnson, A Course in
 * Phonetics, 7th ed., ch. 1): lips closed for p, b, m; the lower lip to the
 * upper teeth for f, v; the tip between the teeth for th, to the alveolar
 * ridge for t, d, n, l and near it for s, z; the dorsum to the soft palate for
 * k, g; rounded lips for ch, sh, r and the back vowels; spread lips for the
 * front vowels; and the jaw opening with the vowel's openness. The intensity
 * each viseme gives a unit, and the openings as shares of the person's
 * maximal opening, are conventions read from those descriptions, not
 * measurements; /s/ keeps the teeth about a millimetre apart, the closest
 * speaking space (Silverman 1953, J Prosthet Dent, "The speaking method in
 * measuring vertical dimension"; the paper itself was not read here).
 *
 * The jaw belongs to the pose. The opening here is what the expression asks
 * of it; a caller adds it to the pose's `head.jaw.opening`.
 */
export namespace AutoMovieHumanMouthExpression {
  /** Lip channels a side acts on alone. */
  export const PAIRED = [
    "upperLipRaiser",
    "lipCornerPuller",
    "lipCornerDepressor",
    "lipStretcher",
    "lowerLipDepressor",
  ] as const;

  /** Lip channels that act on the whole mouth. */
  export const WHOLE = [
    "chinRaiser",
    "lipPucker",
    "lipFunneler",
    "lipTightener",
    "lipPressor",
    "lipsPart",
    "lipSuck",
    "cheekPuff",
  ] as const;

  /** Tongue controls. */
  export const TONGUE = [
    "tipElevation",
    "tipProtrusion",
    "tipLateral",
    "dorsumHeight",
    "dorsumBacking",
  ] as const;

  /** A side-acting channel. */
  export type Paired = (typeof PAIRED)[number];

  /** A lip channel that may receive a unilateral action-unit request. */
  export type Lip = Paired | Whole;

  /** A whole-mouth channel. */
  export type Whole = (typeof WHOLE)[number];

  /** A tongue control. */
  export type Tongue = (typeof TONGUE)[number];

  /** The resolved mouth. */
  export interface IResolved {
    /** Per-side channel contribution, 0 to 1; bilateral whole requests add at the field's final clamp. */
    left: Record<Lip, number>;

    /** The same on the person's right. */
    right: Record<Lip, number>;

    /** Intensity of each whole-mouth channel, 0 to 1. */
    whole: Record<Whole, number>;

    /** Tongue controls in their ranges. */
    tongue: Record<Tongue, number>;

    /** Interincisal opening the expression asks of the jaw, mm. */
    opening: number;
  }

  /** The viseme names, as `IAutoMovieHumanVisemeWeights` holds them. */
  export const VISEMES: readonly (keyof IAutoMovieHumanVisemeWeights)[] = [
    "sil", "PP", "FF", "TH", "DD", "kk", "CH", "SS", "nn", "RR", "aa", "E", "I", "O", "U",
  ];

  /** One viseme's articulation. */
  interface IArticulation {
    /** Lip units, both sides alike. */
    lips: Partial<Record<Paired | Whole, number>>;

    /** Tongue controls. */
    tongue: Partial<Record<Tongue, number>>;

    /** Opening as a share of the person's maximal opening. */
    jaw: number;
  }

  /** Articulation of each viseme (conventions; see the namespace). */
  const ARTICULATION: Record<keyof IAutoMovieHumanVisemeWeights, IArticulation> = {
    sil: { lips: {}, tongue: {}, jaw: 0 },
    PP: { lips: { lipPressor: 0.6 }, tongue: {}, jaw: 0 },
    FF: { lips: { chinRaiser: 0.5, lipSuck: 0.35, upperLipRaiser: 0.25 }, tongue: {}, jaw: 0.04 },
    TH: { lips: { lipsPart: 0.4 }, tongue: { tipProtrusion: 0.35, tipElevation: 0.1 }, jaw: 0.08 },
    DD: { lips: { lipsPart: 0.35 }, tongue: { tipElevation: 1 }, jaw: 0.08 },
    kk: { lips: { lipsPart: 0.35 }, tongue: { dorsumHeight: 1, dorsumBacking: 0.6 }, jaw: 0.12 },
    CH: { lips: { lipFunneler: 0.6, lipPucker: 0.4 }, tongue: { tipElevation: 0.55 }, jaw: 0.04 },
    SS: { lips: { lipStretcher: 0.3, lipsPart: 0.45 }, tongue: { tipElevation: 0.6 }, jaw: 0.02 },
    nn: { lips: { lipsPart: 0.35 }, tongue: { tipElevation: 1 }, jaw: 0.08 },
    RR: { lips: { lipFunneler: 0.4, lipPucker: 0.3 }, tongue: { tipElevation: 0.6, tipProtrusion: -0.4 }, jaw: 0.1 },
    aa: { lips: { lipsPart: 0.4 }, tongue: { dorsumHeight: -0.6 }, jaw: 0.3 },
    E: { lips: { lipStretcher: 0.4, lipsPart: 0.3 }, tongue: { dorsumHeight: 0.2 }, jaw: 0.18 },
    I: { lips: { lipStretcher: 0.6, lipCornerPuller: 0.2, lipsPart: 0.3 }, tongue: { dorsumHeight: 0.6 }, jaw: 0.1 },
    O: { lips: { lipFunneler: 0.7, lipPucker: 0.4 }, tongue: { dorsumBacking: 0.5 }, jaw: 0.22 },
    U: { lips: { lipPucker: 0.9, lipFunneler: 0.4 }, tongue: { dorsumHeight: 0.5, dorsumBacking: 0.7 }, jaw: 0.1 },
  };

  /**
   * Opening of the jaw's two FACS units as shares of the maximal opening: a
   * moderate drop (AU26) and the stretched-open mouth (AU27), conventions.
   */
  const JAW_DROP: number = 0.4;
  const MOUTH_STRETCH: number = 1;

  /**
   * Resolve an expression's mouth.
   *
   * @param expression The expression, or none for rest.
   * @param maximal The person's maximal interincisal opening, mm.
   */
  export function resolve(
    expression: IAutoMovieHumanExpression | undefined,
    maximal: number,
  ): IResolved {
    const out: IResolved = rest();
    const add = (name: Paired | Whole, side: "both" | "left" | "right", value: number): void => {
      if ((PAIRED as readonly string[]).includes(name) || side !== "both") {
        if (side !== "right") out.left[name] += value;
        if (side !== "left") out.right[name] += value;
      } else out.whole[name as Whole] += value;
    };
    let share: number = 0;
    for (const unit of expression?.units ?? []) {
      const name: string = unit.unit;
      if (name === "jawDrop") share += JAW_DROP * unit.intensity;
      else if (name === "mouthStretch") share += MOUTH_STRETCH * unit.intensity;
      else if ((PAIRED as readonly string[]).includes(name) || (WHOLE as readonly string[]).includes(name))
        add(name as Paired | Whole, unit.side, unit.intensity);
    }
    const lips: IAutoMovieHumanLipExpression | undefined = expression?.mouth?.lips;
    for (const name of PAIRED) {
      const pair = lips?.[name];
      if (pair === undefined) continue;
      out.left[name] += pair.left;
      out.right[name] += pair.right;
    }
    for (const name of WHOLE) out.whole[name] += lips?.[name] ?? 0;
    const tongue: IAutoMovieHumanTongueExpression | undefined = expression?.mouth?.tongue;
    for (const name of TONGUE) out.tongue[name] += tongue?.[name] ?? 0;
    const visemes: IAutoMovieHumanVisemeWeights | undefined = expression?.mouth?.visemes;
    for (const name of VISEMES) {
      const w: number = visemes?.[name] ?? 0;
      if (!(w > 0)) continue;
      const a: IArticulation = ARTICULATION[name];
      for (const [unit, value] of Object.entries(a.lips)) add(unit as Paired | Whole, "both", w * value!);
      for (const [control, value] of Object.entries(a.tongue)) out.tongue[control as Tongue] += w * value!;
      share += w * a.jaw;
    }
    const unitRange = (v: number): number => Math.max(0, Math.min(1, v));
    for (const name of [...PAIRED, ...WHOLE]) {
      out.left[name] = unitRange(out.left[name]);
      out.right[name] = unitRange(out.right[name]);
    }
    for (const name of WHOLE) out.whole[name] = unitRange(out.whole[name]);
    for (const name of TONGUE)
      out.tongue[name] = Math.max(name === "dorsumBacking" ? 0 : -1, Math.min(1, out.tongue[name]));
    out.opening = Math.max(0, Math.min(1, share)) * maximal;
    return out;
  }

  /** The mouth at rest. */
  export function rest(): IResolved {
    const zero = <K extends string>(keys: readonly K[]): Record<K, number> =>
      Object.fromEntries(keys.map((k: K): [K, number] => [k, 0])) as Record<K, number>;
    return { left: zero([...PAIRED, ...WHOLE]), right: zero([...PAIRED, ...WHOLE]), whole: zero(WHOLE), tongue: zero(TONGUE), opening: 0 };
  }

  /** Whether a resolved mouth moves nothing but possibly the jaw. */
  export function still(resolved: IResolved): boolean {
    return [
      ...Object.values(resolved.left),
      ...Object.values(resolved.right),
      ...Object.values(resolved.whole),
      ...Object.values(resolved.tongue),
    ].every((v: number): boolean => v === 0);
  }
}
