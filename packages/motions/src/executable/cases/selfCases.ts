import { AutoMovieChain } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSelfAction,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionHumanTouchForm,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { AutoMovieMotionHumanBody } from "../../body/AutoMovieMotionHumanBody";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "../../compose/AutoMovieMotionHumanTouchForm";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { touch } from "../../touch/internal/touch";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../internal/humanPolygonMan";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./internal/everydayVerdicts";

/**
 * Capture cases of the self-directed body actions on one polygon man standing
 * from quiet standing.
 *
 * - Touch rows of the `touch` law on the performer's own regions: a belly pat, a
 *   nape rub, a scratch of the left forearm, a self hug (hands on the opposite
 *   shoulders), both hands over the ears, a hand on the heart, a slap of the
 *   thigh, a facepalm and a brow wiped with the back of the hand.
 * - Whole-body rows of the `selfAction` law: the stretch, victory arms, a fist
 *   pump, a neck roll and a shoulder roll.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion overshoot. A
 * touch row adds the issue's acceptance for each hand: the effector within 10
 * mm of its region's surface through the contact window (along the normal for a
 * moving kind, as a point for a still one), a pat coming down exactly `count`
 * times, and the forearm never deeper than 10 mm into the rest of the body. The
 * stretch and victory rows check both wrists above the crown at `stroke`; the
 * fist pump checks three drops of the fist.
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 */
export function selfCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  const self = (region: AutoMovieHumanoidRegion) =>
    ({ kind: "self", region }) as const;
  const rows: [string, IAutoMovieMotionHumanTouch.IParams][] = [
    ["pat-belly", { target: self("abdomen"), kind: "pat" }],
    ["rub-nape", { target: self("nape"), kind: "rub" }],
    [
      "scratch-forearm",
      {
        target: self("forearmLeft"),
        kind: "scratch",
        effector: "fingertips",
        count: 4,
      },
    ],
    [
      "hug-self",
      {
        target: self("shoulderLeft"),
        other: self("shoulderRight"),
        kind: "squeeze",
        rests: [
          { hand: "first", part: "lowerArm", on: "leftLowerArm" },
          { hand: "first", part: "lowerArm", on: "chest" },
          { hand: "first", part: "upperArm", on: "chest" },
          { hand: "other", part: "lowerArm", on: "rightLowerArm" },
          { hand: "other", part: "lowerArm", on: "chest" },
          { hand: "other", part: "upperArm", on: "chest" },
        ],
      },
    ],
    [
      "cover-ears",
      { target: self("earRight"), other: self("earLeft"), kind: "press" },
    ],
    ["hand-on-heart", { target: self("chestLeft"), kind: "press" }],
    ["slap-thigh", { target: self("thighFrontRight"), kind: "pat", count: 1 }],
    ["facepalm", { target: self("forehead"), kind: "hold" }],
    [
      "wipe-brow",
      {
        target: self("forehead"),
        kind: "rub",
        effector: "handBack",
        count: 1,
        tangent: "across",
      },
    ],
  ];
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IAutoMovieMotionHumanBody = AutoMovieMotionHumanBody.create(
      man.body.skeleton,
      man.body.profile,
    );
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    for (const [label, params] of rows) {
      const name: string = `self-${label}${suffix}`;
      const performance: IAutoMovieMotionHumanPerformance | null =
        FamilyCaseKit.attempt(out, name, () =>
          perform(body, HumanChain.subject("a").act("touch", params)),
        );
      if (performance === null) continue;
      const kind: IAutoMovieMotionHumanTouchForm.Kind = params.kind ?? "pat";
      const form: IAutoMovieMotionHumanTouchForm.IForm =
        AutoMovieMotionHumanTouchForm.FORMS[kind];
      const effector: IAutoMovieMotionHumanTouchEffector.IEffector =
        touch.EFFECTORS[params.effector ?? "palm"];
      const ready: number = TouchVerdicts.event(performance, "a", "ready");
      const strokeStart: number = TouchVerdicts.event(
        performance,
        "a",
        "strokeStart",
      );
      const strokeEnd: number = TouchVerdicts.event(
        performance,
        "a",
        "strokeEnd",
      );
      const relax: number = TouchVerdicts.event(performance, "a", "relax");
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...everydayVerdicts.standard(performance, "a", body),
      ];
      const target: IAutoMovieMotionTarget = params.target;
      const other: IAutoMovieMotionTarget | undefined = params.other;
      if (target.kind !== "self") continue;
      const hands: [AutoMovieHumanSide, AutoMovieHumanoidRegion][] = [
        ["right", target.region],
        ...(other?.kind === "self"
          ? [
              ["left", other.region] satisfies [
                AutoMovieHumanSide,
                AutoMovieHumanoidRegion,
              ],
            ]
          : []),
      ];
      for (const [side, region] of hands) {
        const pad: number = AutoMovieMotionHumanTouchEffector.pad(
          body,
          side,
          effector,
        );
        const at: TouchVerdicts.IRegion = { subject: "a", body, region };
        const off = (t: number): number =>
          Math.abs(
            TouchVerdicts.off(
              performance,
              "a",
              body,
              side,
              effector,
              at,
              pad,
              t,
            ),
          );
        if (form.lift > 0) {
          verdicts.push(
            TouchVerdicts.within(
              `${side} effector on the ${region} at arrival and leave`,
              off,
              [ready, relax],
              0.01,
            ),
          );
          const count: number = params.count ?? 3;
          const n: number = TouchVerdicts.touches(
            off,
            strokeStart,
            strokeEnd,
            0.01,
          );
          verdicts.push({
            name: `${side} hand comes down ${count} times`,
            passed: n === count,
            detail: `${n} touches within 10 mm`,
          });
        } else {
          const window: number[] = [];
          for (let t: number = ready; t <= relax + 1e-9; t += 1 / 24)
            window.push(t);
          verdicts.push(
            TouchVerdicts.within(
              `${side} effector on the ${region} through the contact`,
              form.travel > 0
                ? off
                : (t: number): number =>
                    TouchVerdicts.miss(
                      performance,
                      "a",
                      body,
                      side,
                      effector,
                      at,
                      pad,
                      t,
                    ),
              window,
              0.01,
            ),
          );
        }
        const entered = TouchVerdicts.entry(
          performance,
          "a",
          body,
          side,
          { subject: "a", body },
          0,
          performance.duration,
        );
        verdicts.push({
          name: `${side} forearm inside the body`,
          passed: entered.gap >= -0.01,
          detail: `${(entered.gap * 1000).toFixed(1)} mm at ${entered.at.toFixed(2)} s (limit -10.0 mm)`,
        });
      }
      out.push({
        name,
        times: TouchVerdicts.times(performance.duration, 0.1, [
          [ready, "ready"],
          [relax, "relax"],
        ]),
        performers: [TouchVerdicts.figure(performance, "a", man)],
        verdicts,
      });
    }

    for (const kind of [
      "stretch",
      "victory",
      "fistPump",
      "neckRoll",
      "shoulderRoll",
    ] satisfies IAutoMovieMotionHumanSelfAction.Kind[]) {
      const name: string = `self-${kind}${suffix}`;
      const performance: IAutoMovieMotionHumanPerformance | null =
        FamilyCaseKit.attempt(out, name, () =>
          perform(body, HumanChain.subject("a").act("selfAction", { kind })),
        );
      if (performance === null) continue;
      const stroke: number = TouchVerdicts.event(performance, "a", "stroke");
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...everydayVerdicts.standard(performance, "a", body),
      ];
      if (kind === "stretch" || kind === "victory") {
        const bones = performance.bones("a", stroke);
        const crown: number = TouchVerdicts.place(
          performance,
          { subject: "a", body, region: "crown" },
          stroke,
        ).point.y;
        for (const side of ["left", "right"] as const) {
          const wrist: number = bones.get(`${side}Hand`)!.worldPosition.y;
          verdicts.push({
            name: `${side} wrist above the crown at stroke`,
            passed: wrist > crown,
            detail: `${((wrist - crown) * 1000).toFixed(1)} mm above`,
          });
        }
      }
      if (kind === "fistPump") {
        const s: number = TouchVerdicts.event(performance, "a", "strokeStart");
        const e: number = TouchVerdicts.event(performance, "a", "strokeEnd");
        const heights: number[] = [];
        for (let t: number = s; t <= e + 1e-9; t += 1 / 96)
          heights.push(
            performance.bones("a", t).get("rightHand")!.worldPosition.y,
          );
        let drops: number = 0;
        for (let i: number = 1; i + 1 < heights.length; i++)
          if (heights[i]! < heights[i - 1]! && heights[i]! <= heights[i + 1]!)
            drops++;
        verdicts.push({
          name: "fist drops 3 times",
          passed: drops === 3,
          detail: `${drops} drops`,
        });
      }
      out.push({
        name,
        times: TouchVerdicts.times(performance.duration, 0.15, [
          [stroke, "stroke"],
        ]),
        performers: [TouchVerdicts.figure(performance, "a", man)],
        verdicts,
      });
    }
  }
  return out;
}

/** A performance of one polygon man standing at the origin heading +Z. */
function perform(
  body: IAutoMovieMotionHumanBody,
  chain: IAutoMovieMotionHumanChain,
): IAutoMovieMotionHumanPerformance {
  return new HumanPerformance({
    seed: "self",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" as const },
      },
    ],
    composition: new AutoMovieChain(chain.node).node,
  });
}
