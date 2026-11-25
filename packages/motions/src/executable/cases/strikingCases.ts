import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanStrikingRecord,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createHumanBody } from "../../body/createHumanBody";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { StrikingRecord } from "../../striking/StrikingRecord";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { StrikingEventVerdicts } from "./StrikingEventVerdicts";
import { StrikingLimb } from "./StrikingLimb";
import { StrikingVerdicts } from "./StrikingVerdicts";
import { strikingScenarios } from "./strikingScenarios";

/**
 * Capture cases of the striking laws on the polygon man, for what the numeric
 * tests cannot show: whether a strike reads as the technique, whether the body
 * carries it, and what the limb meets.
 *
 * Every body of `MotionBodies.SWEEP` plays subject `a` of every scenario of
 * {@link strikingScenarios}, one case per family and body (`<family>-<body>`).
 * Its partner, subject `b`, is the average man, except that the tall man and
 * the small woman face each other, so the sweep holds the largest stature
 * difference both ways.
 *
 * Each case draws the launch, the chamber or mid-delivery, the stop (or the
 * planned contact) and the end of every strike, trails the striking wrist or
 * ankle and marks the planned contact point. Its verdicts are those of
 * {@link StrikingVerdicts} for every strike, the defence verdict of every
 * defence, and, where the scenario carries a late redirect, its refusal. The
 * metrics name the partner and the gap, and for each kick that reaches its
 * chamber key before any stop the heights of its knee, its hip, its target and
 * the defender's shoulders at that key, for the side-sheet review.
 *
 * @param family One scenario family, or all when absent.
 * @param only Keeps the cases whose name it accepts, the others not being
 *   built; every case when absent.
 * @returns The cases, each built as it is read.
 */
export function* strikingCases(
  family?: string,
  only?: (name: string) => boolean,
): Iterable<IMotionCaptureCase> {
  // The cases kept, each with its performer and partner.
  const kept: IKept[] = [];
  for (const who of MotionBodies.SWEEP)
    for (const scenario of strikingScenarios.FAMILIES) {
      if (family !== undefined && family !== scenario) continue;
      const name: string = `${scenario}-${who}`;
      if (only !== undefined && !only(name)) continue;
      const partner: string =
        who === "m-tall"
          ? "f-small"
          : who === "f-small"
            ? "m-tall"
            : "m-average";
      kept.push({ name, scenario, who, partner });
    }

  // Every person those cases draw, prepared once for all of them.
  const people: ReadonlyMap<string, IPerson> = new Map(
    [
      ...new Set<string>(
        kept.flatMap((c: IKept): string[] => [c.who, c.partner]),
      ),
    ].map((name: string): [string, IPerson] => {
      const man: humanPolygonMan.IPolygonMan = MotionBodies.population(name);
      return [
        name,
        { man, body: createHumanBody(man.body.skeleton, man.body.profile) },
      ];
    }),
  );
  for (const c of kept)
    yield build(
      c.name,
      c.scenario,
      people.get(c.who)!,
      people.get(c.partner)!,
      c.partner,
    );
}

/** A case kept: its name, scenario, performer and partner. */
interface IKept {
  /** The case's name. */
  name: string;

  /** Its scenario family. */
  scenario: string;

  /** The performer's population name. */
  who: string;

  /** The partner's population name. */
  partner: string;
}

/** A prepared polygon man and the motion body read from it. */
interface IPerson {
  /** The polygon man drawn. */
  man: humanPolygonMan.IPolygonMan;

  /** Its motion body. */
  body: IAutoMovieMotionHumanBody;
}
/** The record of `IThrownOther`'s site. */
type IThrownOther = { id: string; body: IAutoMovieMotionHumanBody };

/** One strike of a case: who throws it, at whom, and its segment. */
interface IThrown {
  /** The striker's subject id. */
  id: string;

  /** The striker's body. */
  body: IAutoMovieMotionHumanBody;

  /** The other person, when there is one. */
  other: IThrownOther | undefined;

  /** The strike's segment. */
  segment: IAutoMovieMotionHumanSegment;
}
/** The record of `IBuildTargetsItem`'s site. */
type IBuildTargetsItem = {
  at: IAutoMovieVector3;
  radius: number;
  color: number;
};

/** The record of `IBuildTrailsItem`'s site. */
type IBuildTrailsItem = { color: number; points: IAutoMovieVector3[] };

/**
 * Build one case: run the scenario's performance for the two bodies and read
 * its instants, overlays, verdicts and metrics from the displayed poses.
 */
function build(
  name: string,
  scenario: string,
  A: IPerson,
  B: IPerson,
  partner: string,
): IMotionCaptureCase {
  const s: strikingScenarios.IScenario = strikingScenarios(A.body, B.body)[
    scenario
  ]!();
  const perform = (
    a: IAutoMovieMotionHumanChain,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: scenario,
      performers: [
        {
          subject: "a",
          body: A.body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        ...(s.b === undefined
          ? []
          : [
              {
                subject: "b",
                body: B.body,
                at: { x: 0, y: 0, z: s.gap },
                yaw: 180,
                proficiency: { level: "trained" as const },
              },
            ]),
      ],
      composition: (s.b === undefined ? a : a.with(s.b)).node,
    });
  const performance: IAutoMovieMotionHumanPerformance = perform(s.a);
  const people: Omit<IThrown, "segment">[] = [
    {
      id: "a",
      body: A.body,
      other: s.b === undefined ? undefined : { id: "b", body: B.body },
    },
    ...(s.b === undefined
      ? []
      : [{ id: "b", body: B.body, other: { id: "a", body: A.body } }]),
  ];
  const times: IMotionCaptureCase.ITime[] = [];
  const trails: IBuildTrailsItem[] = [];
  const targets: IBuildTargetsItem[] = [];
  const verdicts: IMotionCaptureCase.IVerdict[] = [];
  const chambers: Record<string, Record<string, number>> = {};
  for (const p of people)
    for (const g of performance.segments(p.id)) {
      if (g.name === "defend")
        verdicts.push(StrikingEventVerdicts.defence(p.id, g));
      if (g.name !== "punch" && g.name !== "kick" && g.name !== "knee")
        continue;
      const record: IAutoMovieMotionHumanStrikingRecord.IRecord | undefined =
        StrikingRecord(g.plan);
      const stop: number | undefined = record?.stop(g.end);
      const contact: number = stop ?? StrikingVerdicts.peak(g);
      const limb: StrikingLimb.End = StrikingLimb.end(
        performance,
        p.id,
        g,
        contact,
      );
      const chamber: number | undefined = StrikingVerdicts.at(g, "chamber");
      times.push({ seconds: g.entryTime, label: `${p.id} ${g.id} launch` });
      times.push(
        chamber !== undefined && chamber > g.entryTime
          ? { seconds: chamber, label: `${p.id} chamber` }
          : { seconds: (g.entryTime + contact) / 2, label: `${p.id} mid` },
      );
      times.push({
        seconds: contact,
        label: `${p.id} ${stop === undefined ? "contact" : "stop"}`,
      });
      times.push({ seconds: g.end, label: `${p.id} end` });

      // The striking end joint's trail and the planned contact point.
      const points: IAutoMovieVector3[] = [];
      for (let t: number = g.entryTime; t <= g.end + 1e-9; t += 1 / 48)
        points.push(performance.bones(p.id, t).get(limb)!.worldPosition);
      trails.push({ color: p.id === "a" ? 0xd0503c : 0x3c7ad0, points });
      if (record !== undefined)
        targets.push({ at: record.planned, radius: 0.02, color: 0xe0c040 });

      // A measurement for the review of the side sheets, not a bound: how
      // high the kicking knee is at the chamber key against the target and
      // the defender's shoulders, when the kick reaches that key before any
      // stop.
      if (
        g.name === "kick" &&
        record !== undefined &&
        chamber !== undefined &&
        chamber > g.entryTime &&
        chamber <= g.end &&
        (stop === undefined || chamber <= stop)
      ) {
        const side: AutoMovieHumanSide = StrikingLimb.side(limb);
        const shown: StrikingLimb.Bones = performance.bones(p.id, chamber);
        const others: StrikingLimb.Bones | undefined =
          p.other === undefined
            ? undefined
            : performance.bones(p.other.id, chamber);
        chambers[`${p.id} ${g.id}`] = {
          knee: shown.get(`${side}LowerLeg`)!.worldPosition.y,
          hip: shown.get(`${side}UpperLeg`)!.worldPosition.y,
          target: record.planned.y,
          ...(others === undefined
            ? {}
            : {
                shoulders:
                  (others.get("leftUpperArm")!.worldPosition.y +
                    others.get("rightUpperArm")!.worldPosition.y) /
                  2,
              }),
        };
      }
      verdicts.push(
        ...StrikingVerdicts({
          performance,
          id: p.id,
          body: p.body,
          other: p.other,
          segment: g,
          limb,
          record,
          stop,
          meets: s.meets[g.id],
        }),
      );
    }

  // A redirect after the chamber key must be refused.
  if (s.late !== undefined) {
    const late: IAutoMovieMotionHumanChain = s.late;
    verdicts.push(
      StrikingEventVerdicts.refusal(
        (): IAutoMovieMotionHumanPerformance => perform(late),
      ),
    );
  }
  times.sort(
    (x: IMotionCaptureCase.ITime, y: IMotionCaptureCase.ITime): number =>
      x.seconds - y.seconds,
  );
  const ghosts: IMotionCaptureCase.IGhost[] = [];
  if (s.ghost !== undefined) {
    const source: IAutoMovieMotionHumanPerformance = perform(s.ghost);
    ghosts.push({
      id: "uninterrupted",
      body: A.man.body,
      pose: (t: number) => source.pose("a", t),
      opacity: 0.3,
    });
  }
  return {
    name,
    times,
    performers: [
      {
        id: "a",
        body: A.man.body,
        pose: (t: number) => performance.pose("a", t),
      },
      ...(s.b === undefined
        ? []
        : [
            {
              id: "b",
              body: B.man.body,
              pose: (t: number) => performance.pose("b", t),
              color: 0x7a8fa6,
            },
          ]),
    ],
    ghosts,
    trails,
    targets,
    verdicts,
    metrics: {
      ...(s.b === undefined ? {} : { partner, gap: s.gap }),
      chambers,
    },
  };
}
