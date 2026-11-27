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

import { HumanChain } from "../../chain/HumanChain";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../internal/IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./internal/everydayVerdicts";

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
  /** Compare the feature from the character's hips on a traveling action. */
  relativeToHips?: boolean;
  /** Water plane, world metres, when the author stages a swim. */
  water?: number;
  /** Common instants used to compare parts of the movement at equal phase. */
  phaseEvents?: readonly string[];
  /** Draw in the first take's event clock instead of elapsed film seconds. */
  alignPhase?: boolean;
}

/** The provenance of a row on the capture clock. */
interface IPhaseMark {
  /** The named action event, plus the boundaries of the performance. */
  name: string;
  /** The seconds at which this mark occurs in the first and second take. */
  seconds: readonly [number, number];
}

/** Stills are at 12 Hz, with neighboring frames of the native video clock. */
const STILL_FPS: number = 12;
const NATIVE_FPS: number = 32;
const WALK_PHASES: readonly string[] = [
  "rightHeelStrike1",
  "leftHeelStrike1",
  "rightHeelStrike2",
  "leftHeelStrike2",
  "lastFootfall",
];
const WAVE_PHASES: readonly string[] = ["strokeStart", "strokeEnd"];

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
  const wave: IAutoMovieComposition = HumanChain.subject(actor).gesture({
    kind: "wave",
    manner: { variation: 1 },
  }).node;
  const stand: IAutoMovieComposition = HumanChain.subject(actor).stand({
    hold: 2,
  }).node;
  const walk: IAutoMovieComposition = HumanChain.subject(actor).walk({
    to: { x: 0, y: 0, z: 2.4 },
  }).node;
  const look: IAutoMovieComposition = HumanChain.subject(actor)
    .look({
      target: {
        kind: "point",
        at: { x: 1.53, y: 2.2, z: 1.29 },
        frame: "world",
      },
      cue: "signal",
      duration: 1.2,
    })
    .look({
      target: {
        kind: "point",
        at: { x: 0, y: 1.65, z: 2 },
        frame: "world",
      },
      duration: 0.6,
    }).node;
  const level = (
    composition: IAutoMovieComposition,
    name: "novice" | "amateur" | "trained" | "elite",
  ): IVariant => ({
    label: name,
    seed,
    proficiency: { level: name },
    composition,
  });
  const waveLevels: IPair = {
    name: "diversity-wave-level",
    variants: [level(wave, "novice"), level(wave, "trained")],
    feature: "rightHand",
    phaseEvents: WAVE_PHASES,
  };
  const squatDepth = (depth: "quarter" | "parallel"): IVariant => ({
    label: depth,
    seed,
    proficiency: trained,
    composition: HumanChain.subject(actor).act("exercise", {
      kind: "squat",
      depth,
      count: 1,
    }).node,
  });
  const flowVariants = (
    pose: (flow: -1 | 1) => IAutoMovieComposition,
  ): readonly [IVariant, IVariant] => [
    { label: "bound", seed, proficiency: trained, composition: pose(1) },
    { label: "free", seed, proficiency: trained, composition: pose(-1) },
  ];
  const walkFlow: IPair = {
    name: "diversity-walk-flow",
    variants: flowVariants(
      (flow): IAutoMovieComposition =>
        HumanChain.subject(actor).walk({
          to: { x: 0, y: 0, z: 2.4 },
          manner: { effort: { flow } },
        }).node,
    ),
    feature: "rightHand",
    relativeToHips: true,
    phaseEvents: WALK_PHASES,
  };
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
      phaseEvents: WAVE_PHASES,
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
      phaseEvents: ["beat1", "beat2", "beat3", "beat4"],
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
      phaseEvents: ["beat1", "beat2", "beat3", "beat4"],
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
      phaseEvents: ["bottom1", "bottom2"],
    },
    waveLevels,
    {
      ...waveLevels,
      name: "diversity-wave-level-phase",
      alignPhase: true,
    },
    {
      ...waveLevels,
      name: "diversity-wave-amateur-elite",
      variants: [level(wave, "amateur"), level(wave, "elite")],
    },
    {
      name: "diversity-stand-level",
      variants: [level(stand, "novice"), level(stand, "trained")],
      feature: "head",
    },
    {
      name: "diversity-walk-level",
      variants: [level(walk, "novice"), level(walk, "trained")],
      feature: "leftFoot",
      phaseEvents: WALK_PHASES,
    },
    {
      name: "diversity-wave-flow",
      variants: flowVariants(
        (flow): IAutoMovieComposition =>
          HumanChain.subject(actor).gesture({
            kind: "wave",
            effort: { flow },
          }).node,
      ),
      feature: "rightHand",
      phaseEvents: WAVE_PHASES,
    },
    walkFlow,
    {
      ...walkFlow,
      name: "diversity-walk-flow-phase",
      alignPhase: true,
    },
    {
      name: "diversity-look-reaction",
      variants: [level(look, "novice"), level(look, "trained")],
      feature: "head",
      phaseEvents: ["gazeOn", "settled"],
    },
    {
      name: "diversity-squat-depth",
      variants: [squatDepth("quarter"), squatDepth("parallel")],
      feature: "hips",
      phaseEvents: ["bottom1"],
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
  const marks: readonly IPhaseMark[] = phaseMarks(a, b, pair.phaseEvents ?? []);
  const end: number =
    pair.alignPhase === true ? a.duration : Math.max(a.duration, b.duration);
  const grid: number[] = Array.from(
    { length: Math.ceil(end * STILL_FPS) + 1 },
    (_: unknown, index: number): number => Math.min(index / STILL_FPS, end),
  );
  const critical: ReadonlySet<string> = new Set([
    ...(pair.phaseEvents ?? []),
    "strokeStart",
    "stroke",
    "strokeEnd",
    "retract",
    "settled",
    "rightHeelStrike1",
    "leftHeelStrike1",
    "lastFootfall",
    "beat1",
    "entryLeft1",
    "entryLeft2",
    "breath1",
    "breath2",
    "bottom1",
  ]);
  const around: number[] = [a, b].flatMap(
    (take: HumanPerformance, index: number): number[] =>
      take.segments("a").flatMap(({ start, plan }): number[] =>
        plan.events.flatMap(({ name, share }): number[] => {
          if (!critical.has(name)) return [];
          const instant: number = start + share * plan.duration;
          const frame: number = Math.floor(instant * NATIVE_FPS);
          return [
            (frame - 1) / NATIVE_FPS,
            frame / NATIVE_FPS,
            instant,
            (frame + 1) / NATIVE_FPS,
            (frame + 2) / NATIVE_FPS,
          ]
            .filter((t: number): boolean => t >= 0 && t <= take.duration)
            .map((t: number): number =>
              pair.alignPhase === true && index === 1
                ? phaseSecond(marks, t, 1)
                : t,
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
  const read = (take: HumanPerformance, seconds: number): IAutoMovieVector3 => {
    const bones = take.bones("a", Math.min(seconds, take.duration));
    const feature = bones.get(pair.feature)!.worldPosition;
    return pair.relativeToHips === true
      ? Vector3.subtract(feature, bones.get("hips")!.worldPosition)
      : feature;
  };
  const largest: number = Math.max(
    ...grid.map((seconds: number): number =>
      Vector3.distance(read(a, seconds), read(b, seconds)),
    ),
  );
  const phaseDifference: number = Math.max(
    ...Array.from({ length: 65 }, (_, index: number): number => {
      const seconds: number = (index / 64) * a.duration;
      return Vector3.distance(
        read(a, seconds),
        read(b, phaseSecond(marks, seconds, 0)),
      );
    }),
  );
  const deterministic: boolean = [a, b].every(
    (take: HumanPerformance, index: number): boolean => {
      const probes: number[] = [0, 0.172, 0.414, 0.827, 1].map(
        (share): number => share * take.duration,
      );
      const snapshot: string[] = probes.map((seconds): string =>
        JSON.stringify(actual(take, seconds)),
      );
      const fresh: HumanPerformance = make(pair.variants[index]!);
      return [...probes]
        .reverse()
        .every((seconds: number, reverse: number): boolean => {
          const expected: string = snapshot[probes.length - 1 - reverse]!;
          return (
            JSON.stringify(actual(take, seconds)) === expected &&
            JSON.stringify(actual(fresh, seconds)) === expected
          );
        });
    },
  );
  const verdicts: IMotionCaptureCase.IVerdict[] = [
    {
      name: `${pair.feature} differs at matched seconds`,
      passed: largest > 1e-6,
      detail: `${(1000 * largest).toFixed(2)} mm maximum difference on the 12 Hz capture grid`,
    },
    {
      name: "same-source repeat and reversed seeks",
      passed: deterministic,
      detail: "Five exact full-pose matches per take on independent rebuilds",
    },
  ];
  const invariant: IMotionCaptureCase.IVerdict | undefined = outcome(
    pair,
    a,
    b,
    read,
  );
  if (invariant !== undefined) verdicts.push(invariant);
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
            const local: number =
              pair.alignPhase === true && index === 1
                ? phaseSecond(marks, seconds, 0)
                : seconds;
            const pose: IAutoMoviePose = actual(take, local);
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
      featureOrigin: pair.relativeToHips === true ? "hips" : "world",
      maximumSameSecondDifferenceM: largest,
      maximumSamePhaseDifferenceM: phaseDifference,
      phaseMarks: marks,
      renderedClock:
        pair.alignPhase === true
          ? "event phase of first take"
          : "elapsed seconds",
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

/** Keep only homologous events that are strictly ordered in both takes. */
function phaseMarks(
  a: HumanPerformance,
  b: HumanPerformance,
  names: readonly string[],
): readonly IPhaseMark[] {
  const selected: ReadonlySet<string> = new Set(names);
  const events = (take: HumanPerformance): [string, number][] =>
    take
      .segments("a")
      .flatMap(({ start, plan }, index): [string, number][] =>
        plan.events
          .filter(({ name }): boolean => selected.has(name))
          .map(({ name, share }): [string, number] => [
            `${name}#${index + 1}`,
            start + share * plan.duration,
          ]),
      )
      .sort((x, y): number => x[1] - y[1]);
  const right: Map<string, number> = new Map(events(b));
  const result: IPhaseMark[] = [{ name: "start", seconds: [0, 0] }];
  for (const [name, x] of events(a)) {
    const y: number | undefined = right.get(name);
    const previous: IPhaseMark = result[result.length - 1]!;
    if (
      y === undefined ||
      x <= previous.seconds[0] ||
      y <= previous.seconds[1] ||
      x >= a.duration ||
      y >= b.duration
    )
      continue;
    result.push({ name, seconds: [x, y] });
  }
  result.push({ name: "end", seconds: [a.duration, b.duration] });
  return result;
}

/** Map a film second to the same fraction between two common action events. */
function phaseSecond(
  marks: readonly IPhaseMark[],
  seconds: number,
  from: 0 | 1,
): number {
  const to: 0 | 1 = from === 0 ? 1 : 0;
  for (let index: number = 1; index < marks.length; index++) {
    const start: readonly [number, number] = marks[index - 1]!.seconds;
    const end: readonly [number, number] = marks[index]!.seconds;
    if (seconds > end[from]) continue;
    const share: number = (seconds - start[from]) / (end[from] - start[from]);
    return start[to] + share * (end[to] - start[to]);
  }
  return marks[marks.length - 1]!.seconds[to];
}

/** Compare the authored invariant associated with the variable in each pair. */
function outcome(
  pair: IPair,
  a: HumanPerformance,
  b: HumanPerformance,
  read: (take: HumanPerformance, seconds: number) => IAutoMovieVector3,
): IMotionCaptureCase.IVerdict | undefined {
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
  if (pair.name === "diversity-squat-depth") {
    const quarter: number = read(a, TouchVerdicts.event(a, "a", "bottom1")).y;
    const parallel: number = read(b, TouchVerdicts.event(b, "a", "bottom1")).y;
    return {
      name: "parallel lowers the pelvis farther at the same bottom phase",
      passed: parallel < quarter,
      detail: `${(1000 * (quarter - parallel)).toFixed(2)} mm deeper at bottom1`,
    };
  }
  if (pair.name !== "diversity-squat-pace") return undefined;
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
