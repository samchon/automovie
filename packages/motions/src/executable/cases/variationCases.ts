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
    run.map(
      (s: IStruck): IAutoMovieVector3 => Vector3.subtract(s.point, s.centre),
    );
  const wide: number = dispersion(offsets(novice));
  const narrow: number = dispersion(offsets(expert));
  verdicts.push({
    name: "strike point dispersion ratio",
    passed: wide >= variationCases.RATIO * narrow,
    detail: `${(1000 * wide).toFixed(1)} mm at proficiency 0, ${(1000 * narrow).toFixed(1)} mm at 1, ratio ${(wide / narrow).toFixed(2)}; bound ${variationCases.RATIO}`,
  });
  metrics.strike = { radius, wide, narrow };
  verdicts.push(...defended(body, struck));

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
    chain = chain.gesture({
      kind,
      ...(manner === undefined ? {} : { manner }),
    });
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

/** One repeat's strike point. */
interface IStruck {
  /** The point aimed at on the struck body, world metres. */
  point: IAutoMovieVector3;

  /** The region's own point on the struck body, world metres. */
  centre: IAutoMovieVector3;

  /** The point's signed distance from the struck body's colliders, metres. */
  gap: number;

  /** The region nearest to the point on the body at rest. */
  nearest: AutoMovieHumanoidRegion;
}

/** The target of the varied punch. */
const ABDOMEN: AutoMovieMotionTarget = {
  kind: "person",
  subject: "b",
  region: "abdomen",
};

/** The partner's standing guard. */
function waits(seconds: number): HumanChain {
  return HumanChain.subject("b").guard({
    seconds,
    facing: { kind: "person", subject: "a", region: "face" },
  });
}

/** The striker's guard before a punch. */
function ready(seconds: number = 0.8): HumanChain {
  return HumanChain.subject("a").guard({
    seconds,
    facing: { kind: "person", subject: "b", region: "face" },
  });
}

/** The distance between the two, a jab's range of the striker. */
function range(body: IHumanBody): number {
  return (
    strikingScenarios.JAB_RANGE * StrikingLimb.length(body, "leftHand", false)
  );
}

/**
 * The offset one repeat of a punch aims at within the abdomen: the owner's
 * strike offset on the series the performance gives the punch's repeat, so
 * it is the offset a performed punch carries on its plan (`defended`
 * compares the two on a performed punch).
 */
function aimed(
  struck: IHumanBody,
  anchor: string,
  index: number,
  proficiency: number,
): resolveAutoMovieHumanoidSurfaces.ITangent {
  const skill: HumanSkill.ISkill = HumanSkill.resolve(
    { level: "trained" },
    "variation",
  );
  return AutoMovieMotionHumanVariation.strike(
    AutoMovieMotionHumanVariation.of(
      {
        skill,
        series: (channel: string) => ({
          random: HumanSkill.series(skill, "a", anchor, channel),
          index,
        }),
      },
      { variation: 1, proficiency },
    ),
    "point",
    { radius: StrikingBody.radius(struck, "abdomen"), scatter: 0 },
  );
}

/**
 * The strike points of the repeats of a punch at the partner's abdomen, on
 * the partner standing in their guard. A performed punch at a person costs
 * its whole contact search, so the repeats are read from the owner and one
 * performed punch is checked against it in `defended`.
 */
function strikes(
  body: IHumanBody,
  struck: IHumanBody,
  proficiency: number,
): IStruck[] {
  const performance: HumanPerformance = perform(
    body,
    ready().with(waits(0.8)),
    { body: struck, gap: range(body) },
  );
  const bones = performance.bones("b", 0.4);
  const placed = HumanColliders.placed(struck, bones);
  const centre: IAutoMovieVector3 = StrikingBody.region(
    struck,
    bones,
    "abdomen",
  ).point;
  const rest = (region: AutoMovieHumanoidRegion): IAutoMovieVector3 => {
    const frame = struck.surfaces.regions[region];
    return Vector3.add(struck.rest.get(frame.bone)!, frame.point);
  };
  const out: IStruck[] = [];
  for (let i: number = 0; i < variationCases.REPEATS; i++) {
    const tangent: resolveAutoMovieHumanoidSurfaces.ITangent = aimed(
      struck,
      "punch",
      i,
      proficiency,
    );
    const point: IAutoMovieVector3 = StrikingBody.region(
      struck,
      bones,
      "abdomen",
      tangent,
    ).point;
    let gap: number = Infinity;
    for (const { pose, shapes } of placed)
      for (const shape of shapes)
        gap = Math.min(
          gap,
          physicalShapeSegmentDistance(pose, shape, point, point),
        );
    // At rest, where the region's radius is defined.
    const frame: resolveAutoMovieHumanoidSurfaces.IFrame =
      resolveAutoMovieHumanoidSurfaces.offset(
        struck.skeleton,
        struck.profile,
        "abdomen",
        tangent,
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
    out.push({ point, centre, gap, nearest });
  }
  return out;
}

/**
 * Two performed, varied punches at the abdomen. Against a partner standing
 * in their guard, the plan carries the owner's offset for that repeat, and
 * the record's aim (its planned point less its landing offset) moves from
 * that of the same punch without variation by what the varied point moves
 * from the region's own point. The two are compared as moves because the
 * record's plan is a prediction made at the launch, not the partner's point
 * at the contact. Against a cover forced in time, the cover classes as
 * declared.
 */
function defended(
  body: IHumanBody,
  struck: IHumanBody,
): IMotionCaptureCase.IVerdict[] {
  const varied = {
    technique: "straight",
    at: ABDOMEN,
    manner: { variation: 1, proficiency: 0 },
  } as const;
  const read = (
    manner: boolean,
  ): {
    carried: resolveAutoMovieHumanoidSurfaces.ITangent | undefined;
    audit: IAutoMovieVector3;
    point: IAutoMovieVector3;
  } => {
    const standing: HumanPerformance = perform(
      body,
      ready(2)
        .punch(manner ? varied : { technique: "straight", at: ABDOMEN })
        .with(waits(4)),
      { body: struck, gap: range(body) },
    );
    const punch: HumanSegment.ISegment = standing
      .segments("a")
      .find((g: HumanSegment.ISegment): boolean => g.name === "punch")!;
    const record: StrikingRecord.IRecord | undefined = StrikingRecord.of(
      punch.plan,
    );
    if (record === undefined || punch.plan.contact === undefined)
      throw new Error("A punch records its aim and has a contact");
    return {
      carried: punch.plan.aimed,
      audit: Vector3.subtract(record.planned, record.offset),
      point: StrikingBody.region(
        struck,
        standing.bones("b", punch.start + punch.plan.contact),
        "abdomen",
        punch.plan.aimed,
      ).point,
    };
  };
  const plain = read(false);
  const moved = read(true);
  const expected: resolveAutoMovieHumanoidSurfaces.ITangent = aimed(
    struck,
    "punch",
    0,
    0,
  );
  const carried: resolveAutoMovieHumanoidSurfaces.ITangent | undefined =
    moved.carried;
  const apart: number = Vector3.length(
    Vector3.subtract(
      Vector3.subtract(moved.audit, plain.audit),
      Vector3.subtract(moved.point, plain.point),
    ),
  );
  const covered: HumanPerformance = perform(
    body,
    ready()
      .punch(varied, "body")
      .with(
        waits(0.8).defend({
          kind: "cover",
          against: "body",
          outcome: "inTime",
        }),
      ),
    { body: struck, gap: range(body) },
  );
  return [
    {
      name: "the performed punch carries the owner's strike offset",
      passed:
        carried !== undefined &&
        carried.up === expected.up &&
        carried.out === expected.out &&
        Math.hypot(carried.up, carried.out) > 0,
      detail: `up ${carried?.up.toFixed(4)} out ${carried?.out.toFixed(4)} m, the owner's up ${expected.up.toFixed(4)} out ${expected.out.toFixed(4)} m`,
    },
    {
      name: "the record's aim moves with the strike point",
      passed: apart <= variationCases.ON,
      detail: `${(1000 * apart).toFixed(3)} mm between the record's move and the varied point's move; bound ${1000 * variationCases.ON} mm`,
    },
    StrikingVerdicts.defence(
      "b",
      covered
        .segments("b")
        .find((g: HumanSegment.ISegment): boolean => g.name === "defend")!,
    ),
  ];
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
    values.reduce(
      (sum: number, v: number): number => sum + (v - mean) ** 2,
      0,
    ) / values.length,
  );
}
