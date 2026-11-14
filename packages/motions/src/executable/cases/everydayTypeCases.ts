import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { seated } from "../../everyday/seated";
import { typeText } from "../../everyday/typeText";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanHand } from "../../posture/HumanHand";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { everydayCaseKit } from "./everydayCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * The typing cases of `everydayCases` (`everyday-type-seated` and
 * `everyday-type-standing`), with the verdicts `everydayCases` lists.
 *
 * @param c The body's case context.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cases and where their verdicts are listed.
 * @evidence contracts/development/implementation.md#principled-implementation Each case runs the real performance and measures the fingertips on its displayed poses.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One block per desk.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Instants come from the plan's events.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per desk.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function everydayTypeCases(
  c: everydayCaseKit.IContext,
): IMotionCaptureCase[] {
  const { man, body, suffix } = c;
  const out: IMotionCaptureCase[] = [];
  const within = everydayVerdicts.within;
  const { figure } = everydayCaseKit;
  const one = (chain: HumanChain): HumanPerformance =>
    everydayCaseKit.one(c, chain);
  // Seated at a desk: the keyboard at seated elbow height ahead of the
  // shoulders by the forearm (ANSI/HFES 100-2007 posture), the desk top
  // under it; and standing at a standing desk at standing elbow height.
  const seat: seated.ISeat = {
    at: {
      x: 0,
      y: seated.popliteal(body),
      z: body.rest.get("leftFoot")!.z - 0.1,
    },
    yaw: 0,
    depth: 0.45,
  };
  const sitting: HumanPerformance = one(
    HumanChain.subject("a").sit({ seat, seconds: 0.2 }),
  );
  const held = sitting.posture("a", sitting.duration);
  const reach: number = body.measure.forearm + 0.5 * body.measure.hand;
  const setups: [string, HumanChain, IAutoMovieVector3][] = [
    [
      "seated",
      HumanChain.subject("a").sit({ seat, seconds: 0.2 }),
      {
        x: 0,
        y: held.root.y + body.measure.shoulderHeight - body.measure.upperArm,
        z: held.root.z + body.rest.get("rightUpperArm")!.z + reach,
      },
    ],
    [
      "standing",
      HumanChain.subject("a"),
      {
        x: 0,
        y: body.measure.shoulderHeight - body.measure.upperArm - 0.005,
        z: body.rest.get("rightUpperArm")!.z + reach,
      },
    ],
  ];
  for (const [label, start, at] of setups) {
    const keyboard = { at, yaw: 0 };
    const text: string = "hello world";
    const performance: HumanPerformance = one(
      start.typeText({ keyboard, text }),
    );
    const segment = performance.segments("a").at(-1)!;
    const verdicts: IMotionCaptureCase.IVerdict[] = everydayVerdicts.standard(
      performance,
      "a",
      body,
    );
    let worst: { miss: number; letter: string } = { miss: 0, letter: "" };
    let dips: number[] = [];
    [...text].forEach((letter: string, i: number): void => {
      const t: number =
        segment.start + segment.plan.events[i]!.share * segment.plan.duration;
      const k = typeText.key(letter);
      const tip: IAutoMovieVector3 = HumanHand.frame(
        body,
        performance.bones("a", t),
        k.side,
        "indexTip",
        "point",
      ).point;
      const target: IAutoMovieVector3 = {
        x: keyboard.at.x + k.at.x,
        y: keyboard.at.y - typeText.TRAVEL,
        z: keyboard.at.z + k.at.z,
      };
      const miss: number = Vector3.length(Vector3.subtract(tip, target));
      if (miss > worst.miss) worst = { miss, letter };
      dips.push(keyboard.at.y - tip.y);
    });
    dips = dips.sort((x: number, y: number): number => x - y);
    verdicts.push({
      ...within("fingertip on each key at its press", worst.miss, 0.01, "mm"),
      detail: `${(worst.miss * 1000).toFixed(1)} mm worst, on "${worst.letter}" (limit 10.0 mm)`,
    });
    verdicts.push({
      name: "key dip 2 to 4 mm",
      // A key bottoms out at 4 mm, the law's own travel, so the deepest
      // press is compared at the 0.02 mm the posture resolver holds a
      // contact to.
      passed: dips[0]! >= 0.002 && dips.at(-1)! <= 0.004 + 2e-5,
      detail: `${(dips[0]! * 1000).toFixed(1)} to ${(dips.at(-1)! * 1000).toFixed(1)} mm below the key tops`,
    });
    verdicts.push({
      name: "desk height reported",
      passed: true,
      detail: `${(keyboard.at.y - 0.03).toFixed(3)} m work surface under a keyboard at ${keyboard.at.y.toFixed(3)} m`,
    });
    const boxes: {
      centre: IAutoMovieVector3;
      half: IAutoMovieVector3;
      color: number;
    }[] = [
      {
        centre: { x: 0, y: keyboard.at.y - 0.045, z: keyboard.at.z + 0.2 },
        half: { x: 0.6, y: 0.015, z: 0.3 },
        color: 0x8a6d4b,
      },
      {
        centre: { x: 0, y: keyboard.at.y - 0.015, z: keyboard.at.z },
        half: { x: 0.22, y: 0.015, z: 0.08 },
        color: 0x444444,
      },
    ];
    if (label === "seated")
      boxes.push({
        centre: { x: seat.at.x, y: seat.at.y / 2, z: seat.at.z - 0.225 },
        half: { x: 0.25, y: seat.at.y / 2, z: 0.225 },
        color: 0x9a7b55,
      });
    out.push({
      name: `everyday-type-${label}${suffix}`,
      times: [0, 2, 4, 6, 8].map((i: number) => ({
        seconds:
          segment.start + segment.plan.events[i]!.share * segment.plan.duration,
        label: `press ${text[i]}`,
      })),
      performers: [figure(performance, "a", man)],
      boxes,
      verdicts,
    });
  }
  return out;
}
