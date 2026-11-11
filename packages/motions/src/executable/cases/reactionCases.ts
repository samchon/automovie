import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanColliders } from "../../posture/HumanColliders";
import { StrikingBody } from "../../striking/StrikingBody";
import { StrikingQuality } from "../../striking/StrikingQuality";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the reaction laws on the polygon man, each performed alone
 * from quiet standing and drawn every tenth of a second or denser, with the
 * peak of the reaction among the stills.
 *
 * Every case reports the largest range-of-motion overshoot (none). Beyond
 * that:
 *
 * - `reaction-flinch-ahead` and `reaction-flinch-side`: a flinch from a threat
 *   ahead at head height and from one at the left; foot slip at most 5 mm,
 *   the head farther from the threat at the peak than at the start, and each
 *   wrist before the face at the peak, within the cover's own reach of the
 *   face point (the forearm's radius, two fists and one hand).
 * - `reaction-stagger-back` and `reaction-stagger-side`: a 1 m/s push from
 *   ahead and from the left; foot slip at most 5 mm and the extrapolated
 *   centre of mass inside the feet's base at the end (Hof, Gazendam and Sinke
 *   2005).
 * - `reaction-knockdown`: a knockdown from a blow ahead; the lowest point of
 *   the body's collision shapes never below the floor by more than 10 mm, and
 *   within 10 mm of it once the body lies.
 *
 * @param bodies The sweep bodies to run each case on; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case, its instants and its verdicts with their bounds.
 * @evidence contracts/development/implementation.md#principled-implementation Each case runs the real performance and measures its displayed bones.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One block per reaction over shared helpers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Verdicts read displayed poses, never the laws' goals.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case and body.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function reactionCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IHumanBody = createHumanBody(
      man.body.skeleton,
      man.body.profile,
    );
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    const head: number = body.measure.stature * 0.93;
    const threats: [string, IAutoMovieVector3][] = [
      ["ahead", { x: 0, y: head, z: 1 }],
      ["side", { x: 1, y: head, z: 0 }],
    ];

    for (const [label, at] of threats) {
      const from: AutoMovieMotionTarget = { kind: "point", at, frame: "world" };
      const performance: HumanPerformance = perform(
        body,
        HumanChain.subject("a").flinch({ from }),
      );
      const peak: number = event(performance, "stroke");
      const gap = (seconds: number): number =>
        Vector3.length(
          Vector3.subtract(
            performance.bones("a", seconds).get("head")!.worldPosition,
            at,
          ),
        );
      const bones = performance.bones("a", peak);
      const face = StrikingBody.region(body, bones, "face");
      const reach: number =
        body.measure.forearmRadius +
        2 * StrikingQuality.fist(body.measure.hand) +
        body.measure.hand;
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...everydayVerdicts.standard(performance, "a", body),
        {
          name: "head farther from the threat at the peak",
          passed: gap(peak) > gap(0),
          detail: `${((gap(peak) - gap(0)) * 1000).toFixed(1)} mm farther`,
        },
      ];
      for (const side of ["left", "right"] as const) {
        const wrist: IAutoMovieVector3 = Vector3.subtract(
          bones.get(`${side}Hand`)!.worldPosition,
          face.point,
        );
        const ahead: number = Vector3.dot(wrist, face.normal);
        verdicts.push({
          name: `${side} wrist before the face at the peak`,
          passed: ahead > 0 && Vector3.length(wrist) <= reach,
          detail: `${(ahead * 1000).toFixed(1)} mm ahead, ${(Vector3.length(wrist) * 1000).toFixed(1)} mm away (limit ${(reach * 1000).toFixed(1)} mm)`,
        });
      }
      out.push({
        name: `reaction-flinch-${label}${suffix}`,
        times: times(performance, 0.05, [[peak, "peak"]]),
        performers: [figure(performance, man)],
        targets: [{ at, radius: 0.04, color: 0xd04040 }],
        verdicts,
      });
    }

    for (const [label, at] of threats) {
      const performance: HumanPerformance = perform(
        body,
        HumanChain.subject("a").stagger({
          from: { kind: "point", at, frame: "world" },
          speed: 1,
        }),
      );
      const end: number = performance.duration;
      const margin: number = everydayVerdicts.stability(
        performance,
        "a",
        body,
        end - 1 / 120,
      );
      out.push({
        name: `reaction-stagger-${label === "ahead" ? "back" : "side"}${suffix}`,
        times: times(performance, 0.05, [
          [event(performance, "tipped"), "tipped"],
          [event(performance, "caught"), "caught"],
        ]),
        performers: [figure(performance, man)],
        targets: [{ at, radius: 0.04, color: 0xd04040 }],
        verdicts: [
          ...everydayVerdicts.standard(performance, "a", body),
          {
            name: "caught body balanced over the feet at the end",
            passed: margin >= 0,
            detail: `${(margin * 1000).toFixed(1)} mm margin`,
          },
        ],
      });
    }

    {
      const at: IAutoMovieVector3 = threats[0]![1];
      const performance: HumanPerformance = perform(
        body,
        HumanChain.subject("a").knockdown({
          from: { kind: "point", at, frame: "world" },
        }),
      );
      const end: number = performance.duration;
      let deepest: number = Infinity;
      for (let t: number = 0; t <= end + 1e-9; t += 1 / 120)
        deepest = Math.min(
          deepest,
          HumanColliders.lowest(body, performance.bones("a", t)),
        );
      const lying: number = HumanColliders.lowest(
        body,
        performance.bones("a", end),
      );
      out.push({
        name: `reaction-knockdown${suffix}`,
        times: times(performance, 0.1, [
          [event(performance, "seated"), "seated"],
        ]),
        performers: [figure(performance, man)],
        targets: [{ at, radius: 0.04, color: 0xd04040 }],
        verdicts: [
          everydayVerdicts.within(
            "a ROM overshoot",
            everydayVerdicts.overshoot(performance, "a"),
            1e-6,
            "deg",
          ),
          everydayVerdicts.within(
            "deepest point below the floor",
            Math.max(0, -deepest),
            0.01,
            "mm",
          ),
          everydayVerdicts.within(
            "lying body's lowest point off the floor",
            Math.abs(lying),
            0.01,
            "mm",
          ),
        ],
      });
    }
  }
  return out;
}

/** A performance of one polygon man standing at the origin heading +Z. */
function perform(body: IHumanBody, chain: HumanChain): HumanPerformance {
  return new HumanPerformance({
    seed: "reaction",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" as const },
      },
    ],
    composition: chain.node,
  });
}

/** The drawn performer. */
function figure(
  performance: HumanPerformance,
  man: humanPolygonMan.IPolygonMan,
): IMotionCaptureCase.IPerformer {
  return {
    id: "a",
    body: man.body,
    pose: (seconds: number): IAutoMoviePose => performance.pose("a", seconds),
  };
}

/** The film second of an event of the first action. */
function event(performance: HumanPerformance, name: string): number {
  const segment = performance.segments("a")[0]!;
  return (
    segment.start +
    segment.plan.events.find((e) => e.name === name)!.share *
      segment.plan.duration
  );
}

/** The whole performance at a fixed step, with named instants in their order. */
function times(
  performance: HumanPerformance,
  step: number,
  named: [number, string][],
): IMotionCaptureCase.ITime[] {
  const out: IMotionCaptureCase.ITime[] = named.map(([seconds, label]) => ({
    seconds,
    label,
  }));
  const count: number = Math.ceil(performance.duration / step - 1e-9);
  for (let i: number = 0; i <= count; i++) {
    const seconds: number = Math.min(performance.duration, i * step);
    if (out.every((t) => Math.abs(t.seconds - seconds) > step / 4))
      out.push({ seconds, label: `${seconds.toFixed(2)} s` });
  }
  return out.sort((a, b) => a.seconds - b.seconds);
}
