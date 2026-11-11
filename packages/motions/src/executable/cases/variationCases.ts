import {
  Vector3,
  physicalShapeSegmentDistance,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { AutoMovieMotionHumanTarget } from "../../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanVariation } from "../../compose/AutoMovieMotionHumanVariation";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { HumanSegment } from "../../perform/HumanSegment";
import { HumanColliders } from "../../posture/HumanColliders";
import { HumanFrame } from "../../posture/HumanFrame";
import { HumanHand } from "../../posture/HumanHand";
import { HumanSkill } from "../../skill/HumanSkill";
import { StrikingBody } from "../../striking/StrikingBody";
import { StrikingRecord } from "../../striking/StrikingRecord";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { MotionPlaceVerdicts } from "./MotionPlaceVerdicts";
import { StrikingLimb } from "./StrikingLimb";
import { StrikingVerdicts } from "./StrikingVerdicts";
import { strikingScenarios } from "./strikingScenarios";

/**
 * Capture cases of the seeded variation of symbolic slots on the polygon
 * men, one per body of `MotionBodies.SWEEP` (`variation-<body>`).
 *
 * Each case performs `REPEATS` repeats in a row of `wave`, of `stopPalm` and
 * of a straight punch at the partner's abdomen, at `variation` 1 with the
 * manner's proficiency 0 and 1, and reads the displayed poses:
 *
 * - place: at the stroke's middle every hand reads back as the names its law
 *   states (`MotionPlaceVerdicts`);
 * - dispersion: the root mean square distance of those hands from their mean
 *   at proficiency 0 is at least `RATIO` times that at proficiency 1;
 * - timing: the spread of the stroke's start is at least `RATIO` times
 *   larger at proficiency 0, and the stroke's own length equals that of the
 *   same repeat without variation;
 * - reach: the two farthest of the repeats of the place `ahead` are at least
 *   `VISIBLE` arm lengths apart at proficiency 0 and 0 apart without
 *   variation. No shipped law reaches to `ahead` yet, so this reads the
 *   owner's place on the body;
 * - strike: every point aimed at lies on the partner's colliders within
 *   `ON`, is nearer to `abdomen` than to any other region at rest, the points
 *   span at least `SPAN` of the region's radius upward and sideways at
 *   proficiency 0, their dispersion ratio is at least `RATIO`, and the
 *   record's aim (its planned point less its landing offset) is the same
 *   point within `ON`;
 * - defence: a cover against one varied punch classes as declared.
 *
 * The partner is the average man, except that the tall man and the small
 * woman face each other. The case draws the proficiency 0 wave at its first
 * strokes and marks every repeat's hand, orange at proficiency 0 and blue
 * at 1.
 *
 * @param only Keeps the cases whose name it accepts, the others not being built; every case when absent.
 * @returns The cases, each built as it is read.
 */
export function* variationCases(
  only?: (name: string) => boolean,
): Iterable<IMotionCaptureCase> {
  for (const who of MotionBodies.SWEEP) {
    const name: string = `variation-${who}`;
    if (only !== undefined && !only(name)) continue;
    yield build(name, who);
  }
}
/**
 * Companion constants of {@link variationCases}: the repeat count and the
 * verdict bounds, all provisional values of the variation's acceptance.
 */
export namespace variationCases {
  /** Repeats per series. */
  export const REPEATS: number = 32;

  /** The least ratio of a spread at proficiency 0 to that at proficiency 1. */
  export const RATIO: number = 2;

  /** The least distance between the two farthest reaches, arm lengths. */
  export const VISIBLE: number = 0.1;

  /** The least span of the strike points on each tangent axis, region radii. */
  export const SPAN: number = 0.5;

  /** The bound on a strike point's distance from the collider surface and from the record's aim, metres. */
  export const ON: number = 0.001;
}

/** One repeat of a gesture, read from the displayed pose. */
interface IRepeat {
  /** The palm at the stroke's middle, from the root on the floor, world metres. */
  hand: IAutoMovieVector3;

  /** Whether the hand reads back as the names the law states. */
  placed: IMotionCaptureCase.IVerdict;

  /** Seconds from the action's start to the stroke's start. */
  prepare: number;

  /** The stroke's length, seconds. */
  stroke: number;
}

/** The names `wave` and `stopPalm` state. */
const PLACES: Readonly<
  Record<"wave" | "stopPalm", AutoMovieMotionHumanTarget.IGrid>
> = {
  wave: { height: "eye", lateral: "outside", distance: "near" },
  stopPalm: { height: "shoulder", lateral: "inside", distance: "far" },
};

/** Build one body's case. */
function build(name: string, who: string): IMotionCaptureCase {
  const man: humanPolygonMan.IPolygonMan = MotionBodies.population(who);
  const body: IHumanBody = createHumanBody(man.body.skeleton, man.body.profile);
  const partner: string =
    who === "m-tall" ? "f-small" : who === "f-small" ? "m-tall" : "m-average";
  const other: humanPolygonMan.IPolygonMan = MotionBodies.population(partner);
  const struck: IHumanBody = createHumanBody(
    other.body.skeleton,
    other.body.profile,
  );
  const arm: number = body.measure.upperArm + body.measure.forearm;
  const verdicts: IMotionCaptureCase.IVerdict[] = [];
  const targets: { at: IAutoMovieVector3; radius: number; color: number }[] =
    [];
  const metrics: Record<string, unknown> = { partner };
  let drawn: HumanPerformance | undefined;
  const times: IMotionCaptureCase.ITime[] = [];

  for (const kind of ["wave", "stopPalm"] as const) {
    const novice = gestures(body, kind, { variation: 1, proficiency: 0 });
    const expert = gestures(body, kind, { variation: 1, proficiency: 1 });
    const still = gestures(body, kind, undefined);
    for (const [label, run] of [
      ["0", novice],
      ["1", expert],
    ] as const) {
      const missed: IRepeat[] = run.repeats.filter(
        (r: IRepeat): boolean => !r.placed.passed,
      );
      verdicts.push({
        name: `${kind} at its named place, proficiency ${label}`,
        passed: missed.length === 0,
        detail: `${run.repeats.length - missed.length} of ${run.repeats.length}${missed.length === 0 ? "" : `; first other: ${missed[0]!.placed.detail}`}`,
      });
    }
    const hands = (run: { repeats: IRepeat[] }): IAutoMovieVector3[] =>
      run.repeats.map((r: IRepeat): IAutoMovieVector3 => r.hand);
    const wide: number = dispersion(hands(novice));
    const narrow: number = dispersion(hands(expert));
    verdicts.push({
      name: `${kind} place dispersion ratio`,
      passed: wide >= variationCases.RATIO * narrow,
      detail: `${(1000 * wide).toFixed(1)} mm at proficiency 0, ${(1000 * narrow).toFixed(1)} mm at 1, ratio ${(wide / narrow).toFixed(2)}; bound ${variationCases.RATIO}`,
    });
    const starts = (run: { repeats: IRepeat[] }): number =>
      deviation(run.repeats.map((r: IRepeat): number => r.prepare));
    verdicts.push({
      name: `${kind} stroke start spread ratio`,
      passed: starts(novice) >= variationCases.RATIO * starts(expert),
      detail: `${(1000 * starts(novice)).toFixed(1)} ms at proficiency 0, ${(1000 * starts(expert)).toFixed(1)} ms at 1, ratio ${(starts(novice) / starts(expert)).toFixed(2)}; bound ${variationCases.RATIO}`,
    });
    const changed: number = Math.max(
      ...[novice, expert].flatMap((run) =>
        run.repeats.map((r: IRepeat, i: number): number =>
          Math.abs(r.stroke - still.repeats[i]!.stroke),
        ),
      ),
    );
    verdicts.push({
      name: `${kind} stroke length unchanged`,
      passed: changed <= 1e-9,
      detail: `${(1000 * changed).toFixed(6)} ms at most from the same repeat without variation`,
    });
    const fixed: number = dispersion(hands(still));
    metrics[kind] = { wide, narrow, still: fixed };
    for (const [run, color] of [
      [novice, 0xe08030],
      [expert, 0x3c7ad0],
    ] as const)
      if (kind === "wave")
        for (const r of run.repeats)
          targets.push({ at: r.hand, radius: 0.008, color });
    if (kind === "wave") {
      drawn = novice.performance;
      for (let i: number = 0; i < 4; i++)
        times.push({ seconds: novice.middles[i]!, label: `wave ${i + 1}` });
    }
  }

  // A reach to `ahead`, read from the owner on this body.
  const reach = (variation: number): number => {
    const points: IAutoMovieVector3[] = [];
    for (let i: number = 0; i < variationCases.REPEATS; i++)
      points.push(reached(body, i, variation));
    let farthest: number = 0;
    for (const a of points)
      for (const b of points)
        farthest = Math.max(farthest, Vector3.length(Vector3.subtract(a, b)));
    return farthest / arm;
  };
  verdicts.push({
    name: "reach ahead visibly varies",
    passed: reach(1) >= variationCases.VISIBLE,
    detail: `${reach(1).toFixed(3)} arm between the two farthest; bound ${variationCases.VISIBLE}`,
  });
  verdicts.push({
    name: "reach ahead fixed without variation",
    passed: reach(0) === 0,
    detail: `${reach(0).toFixed(6)} arm between the two farthest`,
  });

  // The strike point of a body punch.
  const radius: number = StrikingBody.radius(struck, "abdomen");
  const novice = strikes(body, struck, 0);
  const expert = strikes(body, struck, 1);
  for (const [label, run] of [
    ["0", novice],
    ["1", expert],
  ] as const) {
    const off: number = Math.max(
      ...run.map((s: IStruck): number => Math.abs(s.gap)),
    );
    verdicts.push({
      name: `strike points on the collider, proficiency ${label}`,
      passed: off <= variationCases.ON,
      detail: `${(1000 * off).toFixed(3)} mm at most from the surface over ${run.length}; bound ${1000 * variationCases.ON} mm`,
    });
    const elsewhere: IStruck[] = run.filter(
      (s: IStruck): boolean => s.nearest !== "abdomen",
    );
    verdicts.push({
      name: `strike points nearest to abdomen, proficiency ${label}`,
      passed: elsewhere.length === 0,
      detail: `${run.length - elsewhere.length} of ${run.length}${elsewhere.length === 0 ? "" : `; first other: ${elsewhere[0]!.nearest}`}`,
    });
    const apart: number = Math.max(
      ...run.map((s: IStruck): number =>
        Vector3.length(Vector3.subtract(s.audit, s.point)),
      ),
    );
    verdicts.push({
      name: `the record aims at the same strike point, proficiency ${label}`,
      passed: apart <= variationCases.ON,
      detail: `${(1000 * apart).toFixed(3)} mm at most over ${run.length}; bound ${1000 * variationCases.ON} mm`,
    });
  }
  for (const axis of ["y", "x"] as const) {
    const values: number[] = novice.map(
      (s: IStruck): number => s.point[axis] - s.centre[axis],
    );
    const span: number = (Math.max(...values) - Math.min(...values)) / radius;
    verdicts.push({
      name: `strike points span ${axis === "y" ? "upward" : "sideways"}`,
      passed: span >= variationCases.SPAN,
      detail: `${span.toFixed(2)} of the region's ${(1000 * radius).toFixed(0)} mm radius; bound ${variationCases.SPAN}`,
    });
  }
  const offsets = (run: IStruck[]): IAutoMovieVector3[] =>
    run.map((s: IStruck): IAutoMovieVector3 =>
      Vector3.subtract(s.point, s.centre),
    );
  const wide: number = dispersion(offsets(novice));
  const narrow: number = dispersion(offsets(expert));
  verdicts.push({
    name: "strike point dispersion ratio",
    passed: wide >= variationCases.RATIO * narrow,
    detail: `${(1000 * wide).toFixed(1)} mm at proficiency 0, ${(1000 * narrow).toFixed(1)} mm at 1, ratio ${(wide / narrow).toFixed(2)}; bound ${variationCases.RATIO}`,
  });
  metrics.strike = { radius, wide, narrow };
  verdicts.push(defended(body, struck));

  if (drawn === undefined) throw new Error("The wave was not performed");
  const performance: HumanPerformance = drawn;
  return {
    name,
    times,
    performers: [
      {
        id: "a",
        body: man.body,
        pose: (t: number) => performance.pose("a", t),
      },
    ],
    targets,
    verdicts,
    metrics,
  };
}

/** One performer, trained, at the origin facing +Z, and an optional partner a gap ahead facing back. */
function perform(
  body: IHumanBody,
  chain: HumanChain,
  partner?: { body: IHumanBody; gap: number },
): HumanPerformance {
  return new HumanPerformance({
    seed: "variation",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      ...(partner === undefined
        ? []
        : [
            {
              subject: "b",
              body: partner.body,
              at: { x: 0, y: 0, z: partner.gap },
              yaw: 180,
              proficiency: { level: "trained" as const },
            },
          ]),
    ],
    composition: chain.node,
  });
}

/** The repeats of one gesture in a row, read at each stroke's middle. */
function gestures(
  body: IHumanBody,
  kind: "wave" | "stopPalm",
  manner: { variation: number; proficiency: number } | undefined,
): { performance: HumanPerformance; repeats: IRepeat[]; middles: number[] } {
  let chain: HumanChain = HumanChain.subject("a");
  for (let i: number = 0; i < variationCases.REPEATS; i++)
    chain = chain.gesture({ kind, ...(manner === undefined ? {} : { manner }) });
  const performance: HumanPerformance = perform(body, chain);
  const middles: number[] = [];
  const repeats: IRepeat[] = performance
    .segments("a")
    .map((g: HumanSegment.ISegment): IRepeat => {
      const at = (name: string): number =>
        g.start +
        g.plan.events.find((e) => e.name === name)!.share * g.plan.duration;
      const from: number = at("strokeStart");
      const to: number = at("strokeEnd");
      const mid: number = (from + to) / 2;
      middles.push(mid);
      const root = performance.pose("a", mid).root;
      if (root === null) throw new Error("A performed pose has a root");
      const palm: IAutoMovieVector3 = HumanHand.frame(
        body,
        performance.bones("a", mid),
        "right",
        "palm",
      ).point;
      return {
        hand: {
          x: palm.x - root.translation.x,
          y: palm.y,
          z: palm.z - root.translation.z,
        },
        placed: MotionPlaceVerdicts.at(
          kind,
          body,
          { root: root.translation, yaw: HumanFrame.heading(root.rotation) },
          "right",
          palm,
          PLACES[kind],
        ),
        prepare: from - g.start,
        stroke: to - from,
      };
    });
  return { performance, repeats, middles };
}

/**
 * One repeat of a reach to `ahead` on a body standing at the origin: the
 * owner's place for the right hand arriving from where it hangs.
 */
function reached(
  body: IHumanBody,
  index: number,
  variation: number,
): IAutoMovieVector3 {
  const posture = { root: { x: 0, y: 0, z: 0 }, yaw: 0 };
  const record: AutoMovieMotionHumanTarget.IDefault =
    AutoMovieMotionHumanTarget.DEFAULTS.ahead;
  const named: IAutoMovieVector3 = AutoMovieMotionHumanTarget.fallback(
    body,
    posture,
    record,
  ).point;
  const shoulder: IAutoMovieVector3 = body.rest.get("rightUpperArm")!;
  const distance: number = Vector3.length(
    Vector3.subtract(named, {
      ...shoulder,
      y: shoulder.y - body.measure.upperArm - body.measure.forearm,
    }),
  );
  const skill: HumanSkill.ISkill = HumanSkill.resolve({ p: 0 }, "variation");
  const source: AutoMovieMotionHumanVariation.ISource | undefined =
    AutoMovieMotionHumanVariation.of(
      {
        skill,
        series: (channel: string) => ({
          random: HumanSkill.series(skill, "a", "reach", channel),
          index,
        }),
      },
      { variation },
    );
  return AutoMovieMotionHumanTarget.fallback(
    body,
    posture,
    AutoMovieMotionHumanVariation.place(
      source,
      "reach.place",
      body,
      "right",
      record,
      {
        distance,
        seconds: AutoMovieMotionHumanTiming.transport(distance),
      },
    ),
  ).point;
}

/** One punch's strike point. */
interface IStruck {
  /** The point aimed at on the struck body at the contact, world metres. */
  point: IAutoMovieVector3;

  /** The region's own point at the contact, world metres. */
  centre: IAutoMovieVector3;

  /** The point's signed distance from the struck body's colliders, metres. */
  gap: number;

  /** The region nearest to the point on the body at rest. */
  nearest: AutoMovieHumanoidRegion;

  /** The record's aim: its planned point less its landing offset, world metres. */
  audit: IAutoMovieVector3;
}

/** The target of the varied punch. */
const ABDOMEN: AutoMovieMotionTarget = {
  kind: "person",
  subject: "b",
  region: "abdomen",
};

/** The partner's standing guard, long enough for every repeat. */
function waits(seconds: number): HumanChain {
  return HumanChain.subject("b").guard({
    seconds,
    facing: { kind: "person", subject: "a", region: "face" },
  });
}

/** The striker's guard before the punches. */
function ready(): HumanChain {
  return HumanChain.subject("a").guard({
    seconds: 0.8,
    facing: { kind: "person", subject: "b", region: "face" },
  });
}

/** The repeats of a straight punch at the partner's abdomen, each read at its contact. */
function strikes(
  body: IHumanBody,
  struck: IHumanBody,
  proficiency: number,
): IStruck[] {
  let chain: HumanChain = ready();
  for (let i: number = 0; i < variationCases.REPEATS; i++)
    chain = chain.punch({
      technique: "straight",
      at: ABDOMEN,
      manner: { variation: 1, proficiency },
    });
  const performance: HumanPerformance = perform(
    body,
    chain.with(waits(60)),
    {
      body: struck,
      gap:
        strikingScenarios.JAB_RANGE *
        StrikingLimb.length(body, "leftHand", false),
    },
  );
  const rest = (region: AutoMovieHumanoidRegion): IAutoMovieVector3 => {
    const frame = struck.surfaces.regions[region];
    return Vector3.add(struck.rest.get(frame.bone)!, frame.point);
  };
  return performance
    .segments("a")
    .filter((g: HumanSegment.ISegment): boolean => g.name === "punch")
    .map((g: HumanSegment.ISegment): IStruck => {
      const record: StrikingRecord.IRecord | undefined = StrikingRecord.of(
        g.plan,
      );
      if (record === undefined || g.plan.contact === undefined)
        throw new Error("A punch records its aim and has a contact");
      const bones = performance.bones("b", g.start + g.plan.contact);
      const point: IAutoMovieVector3 = StrikingBody.region(
        struck,
        bones,
        "abdomen",
        g.plan.aimed,
      ).point;
      let gap: number = Infinity;
      for (const { pose, shapes } of HumanColliders.placed(struck, bones))
        for (const shape of shapes)
          gap = Math.min(
            gap,
            physicalShapeSegmentDistance(pose, shape, point, point),
          );
      // At rest, where the region's radius is defined.
      const frame: resolveAutoMovieHumanoidSurfaces.IFrame =
        g.plan.aimed === undefined
          ? struck.surfaces.regions.abdomen
          : resolveAutoMovieHumanoidSurfaces.offset(
              struck.skeleton,
              struck.profile,
              "abdomen",
              g.plan.aimed,
            );
      const still: IAutoMovieVector3 = Vector3.add(
        struck.rest.get(frame.bone)!,
        frame.point,
      );
      let nearest: AutoMovieHumanoidRegion = "abdomen";
      let least: number = Infinity;
      for (const region of Object.keys(
        struck.surfaces.regions,
      ) as AutoMovieHumanoidRegion[]) {
        const d: number = Vector3.length(Vector3.subtract(rest(region), still));
        if (d < least) {
          least = d;
          nearest = region;
        }
      }
      return {
        point,
        centre: StrikingBody.region(struck, bones, "abdomen").point,
        gap,
        nearest,
        audit: Vector3.subtract(record.planned, record.offset),
      };
    });
}

/** A cover forced in time against one varied punch at the abdomen. */
function defended(
  body: IHumanBody,
  struck: IHumanBody,
): IMotionCaptureCase.IVerdict {
  const performance: HumanPerformance = perform(
    body,
    ready()
      .punch(
        {
          technique: "straight",
          at: ABDOMEN,
          manner: { variation: 1, proficiency: 0 },
        },
        "body",
      )
      .with(
        waits(0.8).defend({ kind: "cover", against: "body", outcome: "inTime" }),
      ),
    {
      body: struck,
      gap:
        strikingScenarios.JAB_RANGE *
        StrikingLimb.length(body, "leftHand", false),
    },
  );
  return StrikingVerdicts.defence(
    "b",
    performance
      .segments("b")
      .find((g: HumanSegment.ISegment): boolean => g.name === "defend")!,
  );
}

/** The root mean square distance of points from their mean, metres. */
function dispersion(points: IAutoMovieVector3[]): number {
  const mean: IAutoMovieVector3 = Vector3.scale(
    points.reduce(
      (sum: IAutoMovieVector3, p: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(sum, p),
      { x: 0, y: 0, z: 0 },
    ),
    1 / points.length,
  );
  return Math.sqrt(
    points.reduce(
      (sum: number, p: IAutoMovieVector3): number =>
        sum + Vector3.length(Vector3.subtract(p, mean)) ** 2,
      0,
    ) / points.length,
  );
}

/** The standard deviation of values. */
function deviation(values: number[]): number {
  const mean: number =
    values.reduce((sum: number, v: number): number => sum + v, 0) /
    values.length;
  return Math.sqrt(
    values.reduce((sum: number, v: number): number => sum + (v - mean) ** 2, 0) /
      values.length,
  );
}
