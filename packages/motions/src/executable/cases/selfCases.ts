import { AutoMovieChain } from "@automovie/engine";
import type { AutoMovieHumanoidRegion } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "../../compose/AutoMovieMotionHumanTouchForm";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { HumanHand } from "../../posture/HumanHand";
import type { selfAction } from "../../touch/selfAction";
import { touch } from "../../touch/touch";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the self-directed body actions (#3285) on one polygon man
 * standing from quiet standing.
 *
 * - Touch rows of the `touch` law on the performer's own regions: a belly
 *   pat, a nape rub, a scratch of the left forearm, a self hug (hands on the
 *   opposite shoulders), both hands over the ears, a hand on the heart, a
 *   slap of the thigh, a facepalm and a brow wiped with the back of the hand.
 * - Whole-body rows of the `selfAction` law: the stretch, victory arms, a
 *   fist pump, a neck roll and a shoulder roll.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion
 * overshoot. A touch row adds the issue's acceptance for each hand: the
 * effector within 10 mm of its region's surface through the contact window
 * (along the normal for a moving kind, as a point for a still one), a pat
 * coming down exactly `count` times, and the forearm never deeper than
 * 10 mm into the rest of the body. The stretch and victory rows check both
 * wrists above the crown at `stroke`; the fist pump checks three drops of
 * the fist.
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every row and every verdict with its bound and source.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the real performance and measures displayed bones through the touch effector's point and the engine's region placement.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the touch rows, one over the whole-body rows.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads displayed poses, never the laws' goals; a refused plan becomes a failing verdict.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per row and body.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function selfCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  const self = (region: AutoMovieHumanoidRegion) =>
    ({ kind: "self", region }) as const;
  const rows: [string, touch.IParams][] = [
    ["pat-belly", { target: self("abdomen"), kind: "pat" }],
    ["rub-nape", { target: self("nape"), kind: "rub" }],
    [
      "scratch-forearm",
      {
        target: self("forearmLeft"),
        kind: "scratch",
        with: "fingertips",
        count: 4,
      },
    ],
    [
      "hug-self",
      {
        target: self("shoulderLeft"),
        other: self("shoulderRight"),
        kind: "squeeze",
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
        with: "handBack",
        count: 1,
        tangent: "across",
      },
    ],
  ];
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IHumanBody = createHumanBody(
      man.body.skeleton,
      man.body.profile,
    );
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    for (const [label, params] of rows) {
      const name: string = `self-${label}${suffix}`;
      const performance: HumanPerformance | null = attempt(out, name, () =>
        perform(body, HumanChain.subject("a").act("touch", params)),
      );
      if (performance === null) continue;
      const kind: AutoMovieMotionHumanTouchForm.Kind = params.kind ?? "pat";
      const form: AutoMovieMotionHumanTouchForm.IForm =
        AutoMovieMotionHumanTouchForm.FORMS[kind];
      const effector: AutoMovieMotionHumanTouchEffector.IEffector =
        touch.EFFECTORS[params.with ?? "palm"];
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
      const hands: [HumanHand.Side, AutoMovieHumanoidRegion][] = [
        [
          "right",
          (params.target as { region: AutoMovieHumanoidRegion }).region,
        ],
        ...(params.other === undefined
          ? []
          : [
              [
                "left",
                (params.other as { region: AutoMovieHumanoidRegion }).region,
              ] as [HumanHand.Side, AutoMovieHumanoidRegion],
            ]),
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
    ] as selfAction.Kind[]) {
      const name: string = `self-${kind}${suffix}`;
      const performance: HumanPerformance | null = attempt(out, name, () =>
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

/** A performance or, when planning throws, a failing case pushed in its place. */
function attempt(
  out: IMotionCaptureCase[],
  name: string,
  run: () => HumanPerformance,
): HumanPerformance | null {
  try {
    return run();
  } catch (error) {
    out.push({
      name,
      times: [{ seconds: 0, label: "refused" }],
      performers: [],
      verdicts: [
        { name: "planned", passed: false, detail: (error as Error).message },
      ],
    });
    return null;
  }
}

/** A performance of one polygon man standing at the origin heading +Z. */
function perform(body: IHumanBody, chain: HumanChain): HumanPerformance {
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
