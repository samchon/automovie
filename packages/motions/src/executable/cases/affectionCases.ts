import { AutoMovieChain, Vector3 } from "@automovie/engine";
import type { AutoMovieHumanoidRegion } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "../../compose/AutoMovieMotionHumanTouchForm";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { touch } from "../../touch/touch";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of affectionate and social touch (#3284) between two polygon
 * men of the same body: `a` touches, `b` stands.
 *
 * - `affection-pat-head`, `-tap-shoulder`, `-stroke-arm`, `-cup-cheek`,
 *   `-rub-back`: the touch law on a region of `b` (`b` faces `a` 0.55 m away,
 *   or turns its back 0.45 m ahead for the back rub);
 * - `affection-kiss-cheek`, `-kiss-forehead`: the kiss law;
 * - `affection-high-five`: both performers' high fives.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion overshoot
 * for both performers. A touch case adds the issue's acceptance: the
 * effector within 10 mm of the region's surface through the contact window
 * (along the normal for a moving kind, as a point for a still one), a pat
 * or a tap coming down exactly `count` times, and `a`'s forearm never
 * deeper than 10 mm into `b`. A kiss case checks the lips within 10 mm of
 * the region at `contact`; the high five the two palms' skins within 15 mm
 * at `meet`.
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case, its staging and every verdict with its bound and source.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the real two-person performance and measures the displayed bones through the touch effector's point and the engine's region placement.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One block per law over shared touch verdicts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads displayed poses, never the laws' goals; a refused plan becomes a failing verdict.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case and body.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function affectionCases(
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
    const rows: [string, touch.IParams, boolean][] = [
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
          with: "fingertips",
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
          target: { kind: "person", subject: "b", region: "jawLeft" },
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
      const run = (): HumanPerformance =>
        pair(
          body,
          facing,
          HumanChain.subject("a").act("touch", params),
          HumanChain.subject("b").stand({ seconds: 8 }),
        );
      const performance: HumanPerformance | null = attempt(out, name, run);
      if (performance === null) continue;
      const kind: AutoMovieMotionHumanTouchForm.Kind = params.kind ?? "pat";
      const effector: AutoMovieMotionHumanTouchEffector.IEffector =
        touch.EFFECTORS[params.with ?? "palm"];
      const region: TouchVerdicts.IRegion = {
        subject: "b",
        body,
        region: (params.target as { region: AutoMovieHumanoidRegion }).region,
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
      const form: AutoMovieMotionHumanTouchForm.IForm =
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

    for (const region of ["jawLeft", "forehead"] as const) {
      const name: string = `affection-kiss-${region === "jawLeft" ? "cheek" : "forehead"}${suffix}`;
      const performance: HumanPerformance | null = attempt(
        out,
        name,
        (): HumanPerformance =>
          pair(
            body,
            true,
            HumanChain.subject("a").act("kiss", { partner: "b", region }),
            HumanChain.subject("b").stand({ seconds: 6 }),
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
      const performance: HumanPerformance | null = attempt(
        out,
        name,
        (): HumanPerformance =>
          new HumanPerformance({
            seed: "affection",
            performers: performers(body, true, 0.7),
            composition: new AutoMovieChain({
              kind: "parallel",
              parts: [
                HumanChain.subject("a").act("highFive", { partner: "b" }).node,
                HumanChain.subject("b").act("highFive", { partner: "a" }).node,
              ],
            }).node,
          }),
      );
      if (performance !== null) {
        const meet: number = TouchVerdicts.event(performance, "a", "meet");
        const palm: AutoMovieMotionHumanTouchEffector.IEffector = {
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

/** The two performers: `a` at the origin heading +Z, `b` ahead facing `a` or turned away. */
function performers(
  body: IHumanBody,
  facing: boolean,
  gap: number,
): HumanPerformance.IInput["performers"] {
  return [
    {
      subject: "a",
      body,
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" as const },
    },
    {
      subject: "b",
      body,
      at: { x: 0, y: 0, z: gap },
      yaw: facing ? 180 : 0,
      proficiency: { level: "trained" as const },
    },
  ];
}

/** A performance of `b` standing and `a` acting, side by side in time. */
function pair(
  body: IHumanBody,
  facing: boolean,
  a: HumanChain,
  b: HumanChain,
  gap: number = facing ? 0.55 : 0.45,
): HumanPerformance {
  return new HumanPerformance({
    seed: "affection",
    performers: performers(body, facing, gap),
    composition: new AutoMovieChain({
      kind: "parallel",
      parts: [b.node, a.node],
    }).node,
  });
}
