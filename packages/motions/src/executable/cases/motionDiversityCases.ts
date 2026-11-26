import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieProficiency,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./everydayVerdicts";

/** One side of a matched pair; the simulated subject remains the same. */
interface IVariant {
  /** Figure and manifest label. */
  label: string;
  /** Performance seed. */
  seed: string;
  /** Per-actor proficiency for this take. */
  proficiency: IAutoMovieProficiency;
  /** The authored action. */
  composition: IAutoMovieComposition;
}

/** Paired takes sharing the body, staging, film seconds and camera. */
interface IPair {
  /** The capture's output name. */
  name: string;
  /** The two independently prepared takes. */
  variants: readonly [IVariant, IVariant];
  /** The bone whose world positions are compared, metres. */
  feature: AutoMovieHumanoidBone;
  /** Water plane, world metres, when the author stages a swim. */
  water?: number;
}

/**
 * Matched visual and displayed-skeleton comparisons for distinct variation
 * mechanisms.
 */
export function* motionDiversityCases(
  only?: (name: string) => boolean,
): Iterable<IMotionCaptureCase> {
  const actor: string = "a";
  const seed: string = "diversity";
  const trained: IAutoMovieProficiency = { level: "trained" };
  const gesture: IAutoMovieComposition = HumanChain.subject(actor)
    .gesture({ kind: "wave", manner: { variation: 1, consistency: 0 } })
    .gesture({ kind: "wave", manner: { variation: 1, consistency: 0 } }).node;
  const dance = (intensity: number): IAutoMovieComposition =>
    HumanChain.subject(actor).act("dance", {
      kind: "sway",
      bpm: 120,
      count: 4,
      manner: { intensity },
    }).node;
  const danceVariation: IAutoMovieComposition = HumanChain.subject(actor).act(
    "dance",
    {
      kind: "sway",
      bpm: 120,
      count: 4,
      manner: { variation: 1 },
    },
  ).node;
  const swim: IAutoMovieComposition = HumanChain.subject(actor).act("swim", {
    kind: "frontCrawl",
    count: 2,
    water: 1.2,
  }).node;
  const squat = (pace: number): IAutoMovieComposition =>
    HumanChain.subject(actor).act("exercise", {
      kind: "squat",
      count: 2,
      manner: { pace },
    }).node;
  const cases: readonly IPair[] = [
    {
      name: "diversity-wave-seed",
      variants: [
        { label: "seed-a", seed, proficiency: trained, composition: gesture },
        {
          label: "seed-b",
          seed: "diversity-b",
          proficiency: trained,
          composition: gesture,
        },
      ],
      feature: "rightHand",
    },
    {
      name: "diversity-dance-size",
      variants: [
        {
          label: "compact",
          seed,
          proficiency: trained,
          composition: dance(0.4),
        },
        { label: "full", seed, proficiency: trained, composition: dance(1) },
      ],
      feature: "hips",
    },
    {
      name: "diversity-dance-path",
      variants: [
        {
          label: "loose-path",
          seed,
          proficiency: { level: "trained", axes: { timing: 1, path: 0 } },
          composition: danceVariation,
        },
        {
          label: "precise-path",
          seed,
          proficiency: { level: "trained", axes: { timing: 1, path: 1 } },
          composition: danceVariation,
        },
      ],
      feature: "hips",
    },
    {
      name: "diversity-swim-sequencing",
      variants: [
        {
          label: "loose-coordination",
          seed,
          proficiency: { level: "trained", axes: { sequencing: 0 } },
          composition: swim,
        },
        {
          label: "tight-coordination",
          seed,
          proficiency: { level: "trained", axes: { sequencing: 1 } },
          composition: swim,
        },
      ],
      feature: "leftHand",
      water: 1.2,
    },
    {
      name: "diversity-squat-pace",
      variants: [
        {
          label: "measured",
          seed,
          proficiency: trained,
          composition: squat(0.75),
        },
        {
          label: "brisk",
          seed,
          proficiency: trained,
          composition: squat(1.25),
        },
      ],
      feature: "hips",
    },
  ];
  let body: FamilyCaseKit.IBody | undefined;
  for (const pair of cases) {
    if (only !== undefined && !only(pair.name)) continue;
    body ??= FamilyCaseKit.body("m-average");
    try {
      yield compare(body, pair);
    } catch (error: unknown) {
      yield FamilyCaseKit.refused(pair.name, error);
    }
  }
}

/** Prepare each take before sampling it in film seconds. */
function compare(figure: FamilyCaseKit.IBody, pair: IPair): IMotionCaptureCase {
  const body: IAutoMovieMotionHumanBody = figure.body;
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const make = (variant: IVariant): HumanPerformance =>
    new HumanPerformance({
      seed: variant.seed,
      performers: [
        {
          subject: "a",
          body,
          at: origin,
          yaw: 0,
          proficiency: variant.proficiency,
        },
      ],
      composition: variant.composition,
    });
  const a: HumanPerformance = make(pair.variants[0]);
  const b: HumanPerformance = make(pair.variants[1]);
  const end: number = Math.max(a.duration, b.duration);
  const grid: number[] = Array.from(
    { length: Math.ceil(end * 8) + 1 },
    (_: unknown, index: number): number => Math.min(index / 8, end),
  );
  const critical: ReadonlySet<string> = new Set([
    "strokeStart",
    "strokeEnd",
    "beat1",
    "entryLeft1",
    "breath1",
  ]);
  const around: number[] = [a, b].flatMap((take: HumanPerformance): number[] =>
    take
      .segments("a")
      .slice(0, 1)
      .flatMap(({ start, plan }): number[] =>
        plan.events.flatMap(({ name, share }): number[] => {
          if (!critical.has(name)) return [];
          const instant: number = start + share * plan.duration;
          return [instant - 1 / 32, instant, instant + 1 / 32].filter(
            (t: number): boolean => t >= 0 && t <= end,
          );
        }),
      ),
  );
  const times: IMotionCaptureCase.ITime[] = [...new Set([...grid, ...around])]
    .sort((x: number, y: number): number => x - y)
    .map(
      (seconds: number): IMotionCaptureCase.ITime => ({
        seconds,
        label: `${seconds.toFixed(3)} s`,
      }),
    );
  const actual = (take: HumanPerformance, seconds: number): IAutoMoviePose =>
    take.pose("a", Math.min(seconds, take.duration));
  const read = (take: HumanPerformance, seconds: number): IAutoMovieVector3 =>
    take.bones("a", Math.min(seconds, take.duration)).get(pair.feature)!
      .worldPosition;
  const largest: number = Math.max(
    ...grid.map((seconds: number): number =>
      Vector3.distance(read(a, seconds), read(b, seconds)),
    ),
  );
  const probes: number[] = [0, 0.172, 0.414, 0.827, 1].map(
    (share): number => share * a.duration,
  );
  const snapshot: string[] = probes.map((seconds): string =>
    JSON.stringify(actual(a, seconds)),
  );
  const fresh: HumanPerformance = make(pair.variants[0]);
  const deterministic: boolean = [...probes]
    .reverse()
    .every((seconds: number, index: number): boolean => {
      const expected: string = snapshot[probes.length - 1 - index]!;
      return (
        JSON.stringify(actual(a, seconds)) === expected &&
        JSON.stringify(actual(fresh, seconds)) === expected
      );
    });
  const verdicts: IMotionCaptureCase.IVerdict[] = [
    {
      name: `${pair.feature} differs at matched seconds`,
      passed: largest > 1e-6,
      detail: `${(1000 * largest).toFixed(2)} mm maximum difference on the 8 Hz capture grid`,
    },
    {
      name: "same-source repeat and reversed seeks",
      passed: deterministic,
      detail: `${probes.length} exact full-pose matches on an independent rebuild`,
    },
  ];
  verdicts.push(outcome(pair, a, b, read));
  for (const [variant, take] of [
    [pair.variants[0], a],
    [pair.variants[1], b],
  ] as const) {
    if (pair.water === undefined)
      for (const check of everydayVerdicts.standard(take, "a", body))
        verdicts.push({ ...check, name: `${variant.label} ${check.name}` });
    else {
      const water: number = pair.water;
      const breaths: number[] = [1, 2].map((cycle): number =>
        TouchVerdicts.event(take, "a", `breath${cycle}`),
      );
      const clearance: number = Math.min(
        ...breaths.map(
          (seconds): number =>
            TouchVerdicts.place(
              take,
              { subject: "a", body, region: "mouth" },
              seconds,
            ).point.y - water,
        ),
      );
      verdicts.push({
        name: `${variant.label} mouth clears water at both breaths`,
        passed: clearance > 0,
        detail: `${(1000 * clearance).toFixed(2)} mm minimum at the breathing events`,
      });
    }
  }
  return {
    name: pair.name,
    times,
    performers: [a, b].map(
      (
        take: HumanPerformance,
        index: number,
      ): IMotionCaptureCase.IPerformer => {
        const offset: IAutoMovieVector3 = {
          x: index === 0 ? -0.72 : 0.72,
          y: 0,
          z: 0,
        };
        return {
          id: pair.variants[index]!.label,
          body: figure.man.body,
          pose: (seconds: number): IAutoMoviePose => {
            const pose: IAutoMoviePose = actual(take, seconds);
            return {
              ...pose,
              root: {
                translation: Vector3.add(
                  pose.root?.translation ?? origin,
                  offset,
                ),
                rotation: pose.root?.rotation ?? Quaternion.identity(),
                scale: pose.root?.scale ?? { x: 1, y: 1, z: 1 },
              },
            };
          },
        };
      },
    ),
    verdicts,
    ...(pair.water === undefined
      ? {}
      : {
          trails: [
            {
              color: 0x4080c0,
              points: [
                { x: 0, y: pair.water, z: -0.4 },
                { x: 0, y: pair.water, z: 3 },
              ],
            },
          ],
        }),
    metrics: {
      feature: pair.feature,
      maximumSameSecondDifferenceM: largest,
      durationSeconds: [a.duration, b.duration],
      variants: pair.variants.map(
        ({ label, seed, proficiency, composition }): object => ({
          label,
          seed,
          proficiency,
          composition,
        }),
      ),
      instants: [a, b].map((take: HumanPerformance): object =>
        take.segments("a").map(({ start, plan }) =>
          plan.events.map(({ name, share }) => ({
            name,
            seconds: start + share * plan.duration,
          })),
        ),
      ),
      water: pair.water,
    },
  };
}

/** Compare the authored invariant associated with the variable in each pair. */
function outcome(
  pair: IPair,
  a: HumanPerformance,
  b: HumanPerformance,
  read: (take: HumanPerformance, seconds: number) => IAutoMovieVector3,
): IMotionCaptureCase.IVerdict {
  const equal: (x: number, y: number) => boolean = (x, y) =>
    Math.abs(x - y) <= 1e-9;
  if (pair.name === "diversity-wave-seed") {
    const strokes = (take: HumanPerformance): number[] =>
      take
        .segments("a")
        .map(
          ({ plan }: IAutoMovieMotionHumanSegment): number =>
            (plan.events.find(({ name }): boolean => name === "strokeEnd")!
              .share -
              plan.events.find(({ name }): boolean => name === "strokeStart")!
                .share) *
            plan.duration,
        );
    const lengths: number[] = strokes(a);
    const other: number[] = strokes(b);
    return {
      name: "both wave strokes retain their length",
      passed:
        lengths.length === 2 &&
        lengths.every((length: number, index: number): boolean =>
          equal(length, other[index]!),
        ),
      detail: `${lengths.join(", ")} s and ${other.join(", ")} s`,
    };
  }
  if (pair.name.startsWith("diversity-dance-")) {
    const expected: number[] = [0.5, 1, 1.5, 2];
    return {
      name: "both sway phrases keep the four authored beats",
      passed: [a, b].every((take: HumanPerformance): boolean =>
        expected.every((seconds: number, index: number): boolean =>
          equal(TouchVerdicts.event(take, "a", `beat${index + 1}`), seconds),
        ),
      ),
      detail: `${expected.join(", ")} s`,
    };
  }
  if (pair.name === "diversity-swim-sequencing") {
    const x: number = a.bones("a", a.duration).get("hips")!.worldPosition.z;
    const y: number = b.bones("a", b.duration).get("hips")!.worldPosition.z;
    return {
      name: "both swims finish the same distance in the same time",
      passed: equal(x, y) && equal(a.duration, b.duration),
      detail: `${x.toFixed(3)} m and ${y.toFixed(3)} m`,
    };
  }
  const mismatch: number = Math.max(
    ...Array.from({ length: 17 }, (_, index): number =>
      Vector3.distance(
        read(a, (index / 16) * a.duration),
        read(b, (index / 16) * b.duration),
      ),
    ),
  );
  return {
    name: "both squat cadences retain the same pelvis path at equal phase",
    passed: mismatch <= 0.001 && equal(a.duration * 0.75, b.duration * 1.25),
    detail: `${(mismatch * 1000).toFixed(3)} mm maximum path difference`,
  };
}
