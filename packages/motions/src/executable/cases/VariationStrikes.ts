import {
  Vector3,
  physicalShapeSegmentDistance,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSkill,
  IAutoMovieMotionHumanStrikingRecord,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { AutoMovieMotionHumanVariation } from "../../compose/AutoMovieMotionHumanVariation";
import { HumanColliders } from "../../posture/HumanColliders";
import { HumanSkill } from "../../skill/HumanSkill";
import { StrikingBody } from "../../striking/StrikingBody";
import { StrikingRecord } from "../../striking/StrikingRecord";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { StrikingEventVerdicts } from "./StrikingEventVerdicts";
import { StrikingLimb } from "./StrikingLimb";
import { VariationSeries } from "./VariationSeries";
import { strikingScenarios } from "./strikingScenarios";

/** The record of `IReadResult`'s site. */
type IReadResult = {
  verdicts: IMotionCaptureCase.IVerdict[];
  metrics: IReadMetricsResult;
};

/** The record of `IReadMetricsResult`'s site. */
type IReadMetricsResult = { radius: number; wide: number; narrow: number };

/**
 * The strike verdicts of the variation capture: the points a straight punch
 * aims at within the partner's abdomen over `VariationSeries.REPEATS` repeats
 * at `variation` 1, and one performed, varied punch with its defence.
 */
export namespace VariationStrikes {
  /** The least span of the strike points on each tangent axis, region radii. */
  export const SPAN: number = 0.5;

  /**
   * The bound on a strike point's distance from the collider surface and from
   * the record's aim, metres.
   */
  export const ON: number = 0.001;

  /**
   * Read the strike verdicts of one striker and one struck body.
   *
   * @param body The striker.
   * @param struck The partner.
   * @returns The verdicts, and the region's radius with the two dispersions,
   *   metres.
   */
  export function read(
    body: IAutoMovieMotionHumanBody,
    struck: IAutoMovieMotionHumanBody,
  ): IReadResult {
    const verdicts: IMotionCaptureCase.IVerdict[] = [];
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
        passed: off <= VariationStrikes.ON,
        detail: `${(1000 * off).toFixed(3)} mm at most from the surface over ${run.length}; bound ${1000 * VariationStrikes.ON} mm`,
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
        passed: span >= VariationStrikes.SPAN,
        detail: `${span.toFixed(2)} of the region's ${(1000 * radius).toFixed(0)} mm radius; bound ${VariationStrikes.SPAN}`,
      });
    }
    const offsets = (run: IStruck[]): IAutoMovieVector3[] =>
      run.map(
        (s: IStruck): IAutoMovieVector3 => Vector3.subtract(s.point, s.centre),
      );
    const wide: number = VariationSeries.dispersion(offsets(novice));
    const narrow: number = VariationSeries.dispersion(offsets(expert));
    verdicts.push({
      name: "strike point dispersion ratio",
      // A novice whose strike points do not spread at all shows no variation.
      passed: wide > 0 && wide >= VariationSeries.RATIO * narrow,
      detail: `${(1000 * wide).toFixed(1)} mm at proficiency 0, ${(1000 * narrow).toFixed(1)} mm at 1, ratio ${(wide / narrow).toFixed(2)}; bound ${VariationSeries.RATIO}`,
    });
    verdicts.push(...defended(body, struck));
    return { verdicts, metrics: { radius, wide, narrow } };
  }
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
const ABDOMEN: IAutoMovieMotionTarget = {
  kind: "person",
  subject: "b",
  region: "abdomen",
};

/** The partner's standing guard. */
function waits(seconds: number): IAutoMovieMotionHumanChain {
  return HumanChain.subject("b").guard({
    duration: seconds,
    facing: { kind: "person", subject: "a", region: "face" },
  });
}

/** The striker's guard before a punch. */
function ready(seconds: number = 0.8): IAutoMovieMotionHumanChain {
  return HumanChain.subject("a").guard({
    duration: seconds,
    facing: { kind: "person", subject: "b", region: "face" },
  });
}

/** The distance between the two, a jab's range of the striker. */
function range(body: IAutoMovieMotionHumanBody): number {
  return (
    strikingScenarios.JAB_RANGE * StrikingLimb.length(body, "leftHand", false)
  );
}

/**
 * The offset one repeat of a punch aims at within the abdomen: the owner's
 * strike offset on the series the performance gives the punch's repeat, so it
 * is the offset a performed punch carries on its plan (`defended` compares the
 * two on a performed punch).
 */
function aimed(
  struck: IAutoMovieMotionHumanBody,
  anchor: string,
  index: number,
  proficiency: number,
): IAutoMovieHumanoidSurfaces.ITangent {
  const skill: IAutoMovieMotionHumanSkill = HumanSkill.resolve(
    { level: "trained" },
    "variation",
  );
  return AutoMovieMotionHumanVariation.strike(
    AutoMovieMotionHumanVariation(
      {
        skill,
        series: (channel: string) => ({
          random: HumanSkill.series(skill, "a", anchor, channel),
          index,
        }),
      },
      { variation: 1, consistency: proficiency },
    ),
    "point",
    { radius: StrikingBody.radius(struck, "abdomen"), scatter: 0 },
  );
}

/**
 * The strike points of the repeats of a punch at the partner's abdomen, on the
 * partner standing in their guard. A performed punch at a person costs its
 * whole contact search, so the repeats are read from the owner and one
 * performed punch is checked against it in `defended`.
 */
function strikes(
  body: IAutoMovieMotionHumanBody,
  struck: IAutoMovieMotionHumanBody,
  proficiency: number,
): IStruck[] {
  const performance: IAutoMovieMotionHumanPerformance = VariationSeries.perform(
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
  for (let i: number = 0; i < VariationSeries.REPEATS; i++) {
    const tangent: IAutoMovieHumanoidSurfaces.ITangent = aimed(
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
    const frame: IAutoMovieHumanoidSurfaces.IFrame =
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
/** The record of `IDefendedReadResult`'s site. */
type IDefendedReadResult = {
  carried: IAutoMovieHumanoidSurfaces.ITangent | undefined;
  audit: IAutoMovieVector3;
  point: IAutoMovieVector3;
};

/**
 * Two performed, varied punches at the abdomen. Against a partner standing in
 * their guard, the plan carries the owner's offset for that repeat, and the
 * record's aim (its planned point less its landing offset) moves from that of
 * the same punch without variation by what the varied point moves from the
 * region's own point. The two are compared as moves because the record's plan
 * is a prediction made at the launch, not the partner's point at the contact.
 * Against a cover forced in time, the cover classes as declared.
 */
function defended(
  body: IAutoMovieMotionHumanBody,
  struck: IAutoMovieMotionHumanBody,
): IMotionCaptureCase.IVerdict[] {
  const varied = {
    technique: "straight",
    at: ABDOMEN,
    manner: { variation: 1, proficiency: 0 },
  } as const;
  const read = (manner: boolean): IDefendedReadResult => {
    const standing: IAutoMovieMotionHumanPerformance = VariationSeries.perform(
      body,
      ready(2)
        .punch(manner ? varied : { technique: "straight", at: ABDOMEN })
        .with(waits(4)),
      { body: struck, gap: range(body) },
    );
    const punch: IAutoMovieMotionHumanSegment = standing
      .segments("a")
      .find((g: IAutoMovieMotionHumanSegment): boolean => g.name === "punch")!;
    const record: IAutoMovieMotionHumanStrikingRecord.IRecord | undefined =
      StrikingRecord(punch.plan);
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
  const expected: IAutoMovieHumanoidSurfaces.ITangent = aimed(
    struck,
    "punch",
    0,
    0,
  );
  const carried: IAutoMovieHumanoidSurfaces.ITangent | undefined =
    moved.carried;
  const apart: number = Vector3.length(
    Vector3.subtract(
      Vector3.subtract(moved.audit, plain.audit),
      Vector3.subtract(moved.point, plain.point),
    ),
  );
  const covered: IAutoMovieMotionHumanPerformance = VariationSeries.perform(
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
      passed: apart <= VariationStrikes.ON,
      detail: `${(1000 * apart).toFixed(3)} mm between the record's move and the varied point's move; bound ${1000 * VariationStrikes.ON} mm`,
    },
    StrikingEventVerdicts.defence(
      "b",
      covered
        .segments("b")
        .find(
          (g: IAutoMovieMotionHumanSegment): boolean => g.name === "defend",
        )!,
    ),
  ];
}
