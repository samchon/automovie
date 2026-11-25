import { AutoMovieChain, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionHumanTouchForm,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { createHumanBody } from "../../body/createHumanBody";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "../../compose/AutoMovieMotionHumanTouchForm";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { touch } from "../../touch/touch";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { TouchVerdicts } from "./TouchVerdicts";
import { affectionCasePerformers } from "./affectionCasePerformers";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of affectionate and social touch between two polygon men of the
 * same body: `a` touches, `b` stands.
 *
 * - `affection-pat-head`, `-tap-shoulder`, `-stroke-arm`, `-cup-cheek`,
 *   `-rub-back`: the touch law on a region of `b` (`b` faces `a` 0.55 m away,
 *   or turns its back 0.45 m ahead for the back rub);
 * - `affection-kiss-cheek`, `-kiss-forehead`: the kiss law;
 * - `affection-high-five`: both performers' high fives.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion overshoot
 * for both performers. A touch case adds the issue's acceptance: the effector
 * within 10 mm of the region's surface through the contact window (along the
 * normal for a moving kind, as a point for a still one), a pat or a tap coming
 * down exactly `count` times, and `a`'s forearm never deeper than 10 mm into
 * `b`. A kiss case checks the lips within 10 mm of the region at `contact`; the
 * high five the two palms' skins within 15 mm at `meet`.
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 */
export function affectionCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IAutoMovieMotionHumanBody = createHumanBody(
      man.body.skeleton,
      man.body.profile,
    );
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    const rows: [string, IAutoMovieMotionHumanTouch.IParams, boolean][] = [
      [
        "pat-head",
        {
          target: { kind: "person", subject: "b", region: "crown" },
          kind: "pat",
        },
        true,
      ],
      [
        "tap-shoulder",
        {
          target: { kind: "person", subject: "b", region: "shoulderLeft" },
          kind: "tap",
          effector: "fingertips",
          count: 2,
        },
        true,
      ],
      [
        "stroke-arm",
        {
          target: { kind: "person", subject: "b", region: "upperArmLeft" },
          kind: "stroke",
        },
        true,
      ],
      [
        "cup-cheek",
        {
          target: { kind: "person", subject: "b", region: "cheekLeft" },
          kind: "hold",
        },
        true,
      ],
      [
        "rub-back",
        {
          target: { kind: "person", subject: "b", region: "upperBack" },
          kind: "rub",
        },
        false,
      ],
    ];
    for (const [label, params, facing] of rows) {
      const name: string = `affection-${label}${suffix}`;
      const run = (): IAutoMovieMotionHumanPerformance =>
        pair(
          body,
          facing,
          HumanChain.subject("a").act("touch", params),
          HumanChain.subject("b").stand({ hold: 8 }),
        );
      const performance: IAutoMovieMotionHumanPerformance | null =
        FamilyCaseKit.attempt(out, name, run);
      if (performance === null) continue;
      const kind: IAutoMovieMotionHumanTouchForm.Kind = params.kind ?? "pat";
      const effector: IAutoMovieMotionHumanTouchEffector.IEffector =
        touch.EFFECTORS[params.effector ?? "palm"];
      if (params.target.kind !== "person") continue;
      const region: TouchVerdicts.IRegion = {
        subject: "b",
        body,
        region: params.target.region,
      };
      const pad: number = AutoMovieMotionHumanTouchEffector.pad(
        body,
        "right",
        effector,
      );
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
      const off = (t: number): number =>
        Math.abs(
          TouchVerdicts.off(
            performance,
            "a",
            body,
            "right",
            effector,
            region,
            pad,
            t,
          ),
        );
      const form: IAutoMovieMotionHumanTouchForm.IForm =
        AutoMovieMotionHumanTouchForm.FORMS[kind];
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...everydayVerdicts.standard(performance, "a", body),
        ...everydayVerdicts.standard(performance, "b", body),
      ];
      if (form.lift > 0) {
        const downs: number[] = [ready, relax];
        const count: number = params.count ?? 3;
        verdicts.push(
          TouchVerdicts.within(
            "effector on the surface at arrival and leave",
            off,
            downs,
            0.01,
          ),
        );
        const n: number = TouchVerdicts.touches(
          off,
          strokeStart,
          strokeEnd,
          0.01,
        );
        verdicts.push({
          name: `comes down ${count} times`,
          passed: n === count,
          detail: `${n} touches within 10 mm`,
        });
      } else {
        const window: number[] = [];
        for (let t: number = ready; t <= relax + 1e-9; t += 1 / 24)
          window.push(t);
        verdicts.push(
          TouchVerdicts.within(
            "effector on the surface through the contact",
            form.travel > 0
              ? off
              : (t: number): number =>
                  TouchVerdicts.miss(
                    performance,
                    "a",
                    body,
                    "right",
                    effector,
                    region,
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
        "right",
        { subject: "b", body },
        0,
        performance.duration,
      );
      verdicts.push({
        name: "a's right forearm inside b",
        passed: entered.gap >= -0.01,
        detail: `${(entered.gap * 1000).toFixed(1)} mm at ${entered.at.toFixed(2)} s (limit -10.0 mm)`,
      });
      out.push({
        name,
        times: TouchVerdicts.times(relax + 0.6, 0.1, [
          [ready, "ready"],
          [relax, "relax"],
        ]),
        performers: [
          TouchVerdicts.figure(performance, "a", man),
          TouchVerdicts.figure(performance, "b", man, 0x8090b0),
        ],
        verdicts,
      });
    }

    for (const region of ["cheekLeft", "forehead"] as const) {
      const name: string = `affection-kiss-${region === "cheekLeft" ? "cheek" : "forehead"}${suffix}`;
      const performance: IAutoMovieMotionHumanPerformance | null =
        FamilyCaseKit.attempt(
          out,
          name,
          (): IAutoMovieMotionHumanPerformance =>
            pair(
              body,
              true,
              HumanChain.subject("a").act("kiss", { partner: "b", region }),
              HumanChain.subject("b").stand({ hold: 6 }),
              0.45,
            ),
        );
      if (performance === null) continue;
      const contact: number = TouchVerdicts.event(performance, "a", "contact");
      const lips = TouchVerdicts.place(
        performance,
        { subject: "a", body, region: "mouth" },
        contact,
      ).point;
      const there = TouchVerdicts.place(
        performance,
        { subject: "b", body, region },
        contact,
      ).point;
      const miss: number = Vector3.length(Vector3.subtract(lips, there));
      out.push({
        name,
        times: TouchVerdicts.times(
          TouchVerdicts.event(performance, "a", "part") + 0.8,
          0.1,
          [[contact, "contact"]],
        ),
        performers: [
          TouchVerdicts.figure(performance, "a", man),
          TouchVerdicts.figure(performance, "b", man, 0x8090b0),
        ],
        verdicts: [
          ...everydayVerdicts.standard(performance, "a", body),
          ...everydayVerdicts.standard(performance, "b", body),
          everydayVerdicts.within(
            `lips on b's ${region} at contact`,
            miss,
            0.01,
            "mm",
          ),
        ],
      });
    }

    {
      const name: string = `affection-high-five${suffix}`;
      const performance: IAutoMovieMotionHumanPerformance | null =
        FamilyCaseKit.attempt(
          out,
          name,
          (): IAutoMovieMotionHumanPerformance =>
            new HumanPerformance({
              seed: "affection",
              performers: affectionCasePerformers(body, true, 0.7),
              composition: new AutoMovieChain({
                kind: "parallel",
                parts: [
                  HumanChain.subject("a").act("highFive", { partner: "b" })
                    .node,
                  HumanChain.subject("b").act("highFive", { partner: "a" })
                    .node,
                ],
              }).node,
            }),
        );
      if (performance !== null) {
        const meet: number = TouchVerdicts.event(performance, "a", "meet");
        const palm: IAutoMovieMotionHumanTouchEffector.IEffector = {
          surface: "palm",
          shape: "flat",
        };
        const pad: number = AutoMovieMotionHumanTouchEffector.pad(
          body,
          "right",
          palm,
        );
        const at = (subject: string) =>
          AutoMovieMotionHumanTouchEffector.point(
            body,
            performance.bones(subject, meet),
            "right",
            palm,
          );
        const gap: number = Math.abs(
          Vector3.length(Vector3.subtract(at("a"), at("b"))) - 2 * pad,
        );
        out.push({
          name,
          times: TouchVerdicts.times(performance.duration, 0.1, [
            [meet, "meet"],
          ]),
          performers: [
            TouchVerdicts.figure(performance, "a", man),
            TouchVerdicts.figure(performance, "b", man, 0x8090b0),
          ],
          verdicts: [
            ...everydayVerdicts.standard(performance, "a", body),
            ...everydayVerdicts.standard(performance, "b", body),
            everydayVerdicts.within(
              "palms' skins apart at meet",
              gap,
              0.015,
              "mm",
            ),
          ],
        });
      }
    }
  }
  return out;
}

/** A performance of `b` standing and `a` acting, side by side in time. */
function pair(
  body: IAutoMovieMotionHumanBody,
  facing: boolean,
  a: IAutoMovieMotionHumanChain,
  b: IAutoMovieMotionHumanChain,
  gap: number = facing ? 0.55 : 0.45,
): IAutoMovieMotionHumanPerformance {
  return new HumanPerformance({
    seed: "affection",
    performers: affectionCasePerformers(body, facing, gap),
    composition: new AutoMovieChain({
      kind: "parallel",
      parts: [b.node, a.node],
    }).node,
  });
}
