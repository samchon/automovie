import { HumanPopulationAnchors } from "./HumanPopulationAnchors";
import { HumanPopulationConditional } from "./HumanPopulationConditional";
import { HumanPopulationSurvey } from "./HumanPopulationSurvey";

type Sex = HumanPopulationSurvey.Sex;
type Variable = HumanPopulationSurvey.Variable;

/**
 * The population ends and the measures they take: drivers held at their 1st or
 * 99th percentile, every other measure conditioned on them and held inside its
 * bounds.
 */
export namespace HumanPopulationEnds {
  /** Measures a population end holds at a standard deviate; every other measure takes its conditional mean. */
  export interface IDrivers {
    /** Stature. */
    stature?: number;

    /** Body-mass index, at the person's stature. */
    bmi?: number;

    /** Flexed biceps girth given stature and mass: the muscle the mass carries. */
    muscle?: number;

    /** Crotch height given stature: leg length. */
    crotchHeight?: number;

    /** Biacromial breadth given stature and mass: the skeleton's breadth. */
    biacromial?: number;

    /** Upper-arm length (acromion to radiale) given stature and the drivers before it: arm length at a given stature. */
    arm?: number;

    /** Hand length given stature and the drivers before it. */
    hand?: number;

    /** Foot length given stature and the drivers before it. */
    foot?: number;

    /** Head length. */
    headLength?: number;

    /** Head breadth. */
    headBreadth?: number;
  }

  /** One population end. */
  export interface IEnd {
    /** Name in findings. */
    name: string;

    /** The sex whose statistics build it. */
    sex: Sex;

    /** Whether every default test run reads it; the rest run under the extended set. */
    core: boolean;

    /** The measures held at their ends. */
    drivers: IDrivers;
  }

  /**
   * The ends, per sex: stature, mass, muscle, leg length, shoulder breadth,
   * arm, hand and foot length and head length and breadth, each alone at its
   * 1st and 99th percentile (the limb, hand and foot lengths given stature, so
   * the proportion is the end, not the size); all four stature-by-mass
   * corners, the lean-muscular and heavy-unmuscular bodies, and the combined
   * corners small (every body driver low) and large (every one high). Between
   * the ends sit the mean person and the plus and minus one standard deviate
   * bodies. A combined corner lies beyond the 99 % ellipse (about 1 in 10,000
   * when the drivers are independent): a test end, not an accommodation claim.
   * The survey is adults only, and the Human domain starts at 1,450 mm, so no
   * child is built.
   */
  export const ENDS: readonly IEnd[] = (["female", "male"] as const).flatMap((sex: Sex): IEnd[] => {
    const s: string = sex === "female" ? "f" : "m";
    const end: (label: string, drivers: IDrivers, core?: boolean) => IEnd = (label: string, drivers: IDrivers, core: boolean = false): IEnd => ({ name: `${s}-${label}`, sex, core, drivers });
    const z: number = HumanPopulationSurvey.Z;

    return [
      end("small", { stature: -z, bmi: -z, muscle: -z }, true),
      end("large", { stature: z, bmi: z, muscle: z }, true),
      end("tall-light", { stature: z, bmi: -z }, sex === "female"),
      end("short-heavy", { stature: -z, bmi: z }, sex === "male"),
      end("tall", { stature: z }),
      end("short", { stature: -z }),
      end("heavy", { stature: 0, bmi: z }),
      end("light", { stature: 0, bmi: -z }),
      end("muscular", { stature: 0, bmi: 0, muscle: z }),
      end("unmuscular", { stature: 0, bmi: 0, muscle: -z }),
      end("long-legged", { stature: 0, bmi: 0, crotchHeight: z }),
      end("short-legged", { stature: 0, bmi: 0, crotchHeight: -z }),
      end("broad", { stature: 0, bmi: 0, biacromial: z }),
      end("narrow", { stature: 0, bmi: 0, biacromial: -z }),
      end("long-head", { headLength: z }),
      end("broad-head", { headBreadth: z }),
      end("average", { stature: 0, bmi: 0, muscle: 0 }),
      end("tall-heavy", { stature: z, bmi: z }),
      end("short-light", { stature: -z, bmi: -z }),
      end("lean-muscular", { stature: 0, bmi: -z, muscle: z }),
      end("heavy-unmuscular", { stature: 0, bmi: z, muscle: -z }),
      end("plus-one", { stature: 1, bmi: 1, muscle: 1 }),
      end("minus-one", { stature: -1, bmi: -1, muscle: -1 }),
      end("long-armed", { stature: 0, bmi: 0, arm: z }),
      end("short-armed", { stature: 0, bmi: 0, arm: -z }),
      end("big-handed", { stature: 0, bmi: 0, hand: z }),
      end("small-handed", { stature: 0, bmi: 0, hand: -z }),
      end("big-footed", { stature: 0, bmi: 0, foot: z }),
      end("small-footed", { stature: 0, bmi: 0, foot: -z }),
      end("short-head", { headLength: -z }),
      end("narrow-head", { headBreadth: -z }),
    ];
  });

  /**
   * An end's value of every measure: its drivers fixed in order, every other
   * measure at its conditional mean.
   *
   * A conditional mean past a bound (the declared domain of the input it
   * becomes, or the surveyed extreme) is held at that bound and the rest
   * conditioned on it, so the person stays inside both and stays one body.
   *
   * @param end The end.
   * @returns Every surveyed measure of the end.
   */
  export function measures(end: IEnd): Record<Variable, number> {
    const sex: Sex = end.sex;
    const d: IDrivers = end.drivers;
    const known: Map<number, number> = new Map();
    const fix: (v: Variable, z: number | undefined) => void = (v: Variable, z: number | undefined): void => {
      if (z === undefined) return;
      const at: HumanPopulationConditional.IMoments = HumanPopulationConditional.moments(sex, known, HumanPopulationConditional.index(v));
      known.set(HumanPopulationConditional.index(v), at.mean + z * at.sd);
    };

    fix("stature", d.stature);
    if (d.bmi !== undefined) {
      const stature: number = known.get(HumanPopulationConditional.index("stature")) ?? HumanPopulationSurvey.SURVEY[sex].mean[HumanPopulationConditional.index("stature")];
      const [mean, sd]: readonly [number, number] = HumanPopulationSurvey.BMI[sex];
      known.set(HumanPopulationConditional.index("stature"), stature);
      known.set(HumanPopulationConditional.index("mass"), (mean + d.bmi * sd) * (stature / 1000) ** 2);
    }
    fix("bicepsFlexed", d.muscle);
    fix("crotchHeight", d.crotchHeight);
    fix("biacromial", d.biacromial);
    fix("acromionRadiale", d.arm);
    fix("handLength", d.hand);
    fix("footLength", d.foot);
    fix("headLength", d.headLength);
    fix("headBreadth", d.headBreadth);

    const bounds: [number, number, number][] = limits(sex);
    for (let round: number = 0; ; round++) {
      const x: number[] = HumanPopulationSurvey.VARIABLES.map((_v: Variable, i: number): number => known.get(i) ?? HumanPopulationConditional.moments(sex, known, i).mean);
      const out: [number, number, number][] = bounds.filter(([i, lo, hi]: [number, number, number]): boolean => !known.has(i) && (x[i]! < lo || x[i]! > hi));
      if (out.length === 0 || round === HumanPopulationSurvey.VARIABLES.length)
        return Object.fromEntries(HumanPopulationSurvey.VARIABLES.map((v: Variable, i: number): [Variable, number] => [v, x[i]!])) as Record<Variable, number>;
      for (const [i, lo, hi] of out) known.set(i, Math.min(hi, Math.max(lo, x[i]!)));
    }
  }

  /**
   * Each measure's bounds for a sex: the surveyed extremes, narrowed by the
   * declared domain of the body control the measure becomes, directly or
   * through its anchor ratio.
   *
   * @param sex The surveyed sex.
   * @returns `[measure index, least, greatest]` for every measure.
   */
  export function limits(sex: Sex): [number, number, number][] {
    const t: HumanPopulationSurvey.ISurvey = HumanPopulationSurvey.SURVEY[sex];
    const out: [number, number][] = HumanPopulationSurvey.VARIABLES.map((_v: Variable, i: number): [number, number] => [t.min[i]!, t.max[i]!]);
    const narrow: (i: number, lo: number, hi: number) => void = (i: number, lo: number, hi: number): void => {
      out[i] = [Math.max(out[i]![0], lo), Math.min(out[i]![1], hi)];
    };

    for (const [key, v] of HumanPopulationAnchors.DIRECT) narrow(HumanPopulationConditional.index(v), HumanPopulationSurvey.DOMAIN[key]![0], HumanPopulationSurvey.DOMAIN[key]![1]);
    for (const key of HumanPopulationAnchors.ANCHORED) {
      const a: HumanPopulationAnchors.IAnchor = HumanPopulationAnchors.ANCHORS[key];
      if (a.proxy === "stature") continue;
      const k: number = HumanPopulationAnchors.ratio(sex, a);
      narrow(HumanPopulationConditional.index(a.proxy), HumanPopulationSurvey.DOMAIN[key]![0] / k, HumanPopulationSurvey.DOMAIN[key]![1] / k);
    }

    return out.map(([lo, hi]: [number, number], i: number): [number, number, number] => [i, lo, hi]);
  }
}
