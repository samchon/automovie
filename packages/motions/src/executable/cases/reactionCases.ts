import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../chain/HumanChain";
import { AutoMovieMotionHumanBody } from "../../body/AutoMovieMotionHumanBody";
import { AutoMovieMotionHumanRange } from "../../compose/AutoMovieMotionHumanRange";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanColliders } from "../../posture/HumanColliders";
import { flinch } from "../../reaction/internal/flinch";
import { StrikingBody } from "../../striking/StrikingBody";
import { StrikingQuality } from "../../striking/StrikingQuality";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../internal/humanPolygonMan";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./internal/everydayVerdicts";

/**
 * Capture cases of the reaction laws on the polygon man, each performed alone
 * from quiet standing and drawn every tenth of a second or denser, with the
 * peak of the reaction among the stills.
 *
 * Every case reports the largest range-of-motion overshoot (none). Beyond that:
 *
 * - `reaction-flinch-ahead` and `reaction-flinch-side`: a flinch from a threat
 *   ahead at head height and from one at the left; foot slip at most 5 mm, each
 *   planted foot within 5 mm of the floor, the head farther from the threat at
 *   the peak than at the start and moved no more than the law's size allows
 *   (its height above the hips times the lean's sine, plus the shift and 30 mm
 *   for the neck's duck), and each wrist before the face at the peak, within
 *   the cover's own reach of the face point (the forearm's radius, two fists
 *   and one hand).
 * - `reaction-stagger-back` and `reaction-stagger-side`: a 1 m/s push from ahead
 *   and from the left; foot slip at most 5 mm, each planted foot within 5 mm of
 *   the floor and the extrapolated centre of mass inside the feet's base at the
 *   end (Hof, Gazendam and Sinke 2005).
 * - `reaction-knockdown`: a knockdown from a blow ahead; the lowest point of the
 *   body's collision shapes never below the floor by more than 10 mm, the seat
 *   and the feet both within 10 mm of the floor as the seat lands, and the
 *   lowest point within 10 mm of the floor once the body lies.
 *
 * @param bodies The sweep bodies to run each case on; `m-average` when absent.
 * @returns The cases.
 */
export function reactionCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IAutoMovieMotionHumanBody = AutoMovieMotionHumanBody.create(
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
      const from: IAutoMovieMotionTarget = {
        kind: "point",
        at,
        frame: "world",
      };
      const performance: IAutoMovieMotionHumanPerformance = perform(
        body,
        HumanChain.subject("a").flinch({ target: from }),
      );
      const peak: number = FamilyCaseKit.event(performance, "stroke");
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
      const start = performance.bones("a", 0);
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...everydayVerdicts.standard(performance, "a", body),
        planted(performance, body),
        {
          name: "head farther from the threat at the peak",
          passed: gap(peak) > gap(0),
          detail: `${((gap(peak) - gap(0)) * 1000).toFixed(1)} mm farther`,
        },
        everydayVerdicts.within(
          "head travel at the peak",
          Vector3.length(
            Vector3.subtract(
              bones.get("head")!.worldPosition,
              start.get("head")!.worldPosition,
            ),
          ),
          (start.get("head")!.worldPosition.y -
            start.get("hips")!.worldPosition.y) *
            Math.sin(
              (AutoMovieMotionHumanRange.lean(flinch.LEAN) * Math.PI) / 180,
            ) +
            AutoMovieMotionHumanRange.shift(body, flinch.SHIFT) +
            0.03,
          "mm",
        ),
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
        times: FamilyCaseKit.times(performance, 0.05, [[peak, "peak"]]),
        performers: [FamilyCaseKit.figure(performance, man)],
        targets: [{ at, radius: 0.04, color: 0xd04040 }],
        verdicts,
      });
    }

    for (const [label, at] of threats) {
      const performance: IAutoMovieMotionHumanPerformance = perform(
        body,
        HumanChain.subject("a").stagger({
          target: { kind: "point", at, frame: "world" },
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
        times: FamilyCaseKit.times(performance, 0.05, [
          [FamilyCaseKit.event(performance, "tipped"), "tipped"],
          [FamilyCaseKit.event(performance, "caught"), "caught"],
        ]),
        performers: [FamilyCaseKit.figure(performance, man)],
        targets: [{ at, radius: 0.04, color: 0xd04040 }],
        verdicts: [
          ...everydayVerdicts.standard(performance, "a", body),
          planted(performance, body),
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
      const performance: IAutoMovieMotionHumanPerformance = perform(
        body,
        HumanChain.subject("a").knockdown({
          target: { kind: "point", at, frame: "world" },
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
      const low: (of: (bone: string) => boolean) => number = (
        of: (bone: string) => boolean,
      ): number =>
        FamilyCaseKit.lowest(
          performance,
          body,
          "a",
          FamilyCaseKit.event(performance, "seated"),
          of,
        );
      out.push({
        name: `reaction-knockdown${suffix}`,
        times: FamilyCaseKit.times(performance, 0.1, [
          [FamilyCaseKit.event(performance, "seated"), "seated"],
        ]),
        performers: [FamilyCaseKit.figure(performance, man)],
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
            "seat off the floor as it lands",
            Math.abs(low((b) => b === "hips" || b.endsWith("UpperLeg"))),
            0.01,
            "mm",
          ),
          everydayVerdicts.within(
            "feet off the floor as the seat lands",
            Math.abs(low((b) => /(LowerLeg|Foot|Toes)$/.test(b))),
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

/** A planted foot stays on the floor: within 5 mm in its plant windows. */
function planted(
  performance: IAutoMovieMotionHumanPerformance,
  body: IAutoMovieMotionHumanBody,
): IMotionCaptureCase.IVerdict {
  const off = everydayVerdicts.grounded(performance, "a", body);
  const verdict: IMotionCaptureCase.IVerdict = everydayVerdicts.within(
    "a planted foot off the floor",
    off.value,
    0.005,
    "mm",
  );
  return { ...verdict, detail: `${verdict.detail}, worst in ${off.where}` };
}

/** A performance of one polygon man standing at the origin heading +Z. */
function perform(
  body: IAutoMovieMotionHumanBody,
  chain: IAutoMovieMotionHumanChain,
): IAutoMovieMotionHumanPerformance {
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
