import {
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { operate } from "../../affordance/operate";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import { wipe } from "../../tasks/wipe";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the household family (#3256), from quiet standing with
 * the right hand, at a counter 225 mm below the elbow (Li, Chang and Zhang
 * 2024's preferred band of 200 to 250 mm):
 *
 * - `household-wipe`: three circles wiping the counter;
 * - `household-drawer-wipe`: a composed task, a drawer under the counter
 *   pulled 0.25 m open, then the counter wiped.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion overshoot,
 * and that from `strokeStart` to `strokeEnd` of the wipe the palm socket
 * lies within -10 to +10 mm of the counter's top and within 10 mm of the
 * wipe's planned circle (provisional bounds at decision 11's accuracy).
 *
 * @param bodies The sweep bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the cases and verdicts with their bounds and sources.
 * @evidence contracts/development/implementation.md#principled-implementation Measures the displayed palm against the surface and the planned circle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over two chains over the shared kit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Verdicts read displayed poses.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in frames.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function householdCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    const m = who.body.measure;
    const top: number = m.shoulderHeight - m.upperArm - 0.225;
    const centre: IAutoMovieVector3 = { x: -0.15, y: top, z: 0.4 };
    const wiping: wipe.IParams = {
      on: { kind: "point", at: centre, frame: "world" },
      cycles: 3,
    };
    const drawer: operate.IParams = {
      mechanism: {
        kind: "slider",
        at: {
          kind: "point",
          at: { x: -0.15, y: top - 0.12, z: 0.3 },
          frame: "world",
          normal: { x: 0, y: 0, z: -1 },
        },
        travel: 0.25,
      },
    };
    const chains: [string, HumanChain][] = [
      ["wipe", HumanChain.subject("a").act("wipe", wiping)],
      [
        "drawer-wipe",
        HumanChain.subject("a").act("operate", drawer).act("wipe", wiping),
      ],
    ];
    for (const [label, chain] of chains) {
      const performance: HumanPerformance = FamilyCaseKit.perform(
        "household",
        [{ subject: "a", body: who.body }],
        chain,
      );
      const segment = performance.segments("a").at(-1)!;
      const at = (name: string): number =>
        segment.start +
        segment.plan.events.find((e) => e.name === name)!.share *
          segment.plan.duration;
      const from: number = at("strokeStart");
      const to: number = at("strokeEnd");
      const palm = (t: number): IAutoMovieVector3 => {
        const frame = who.body.surfaces.sockets.palmRight;
        return resolveAutoMovieHumanoidSurfaces.place(
          frame,
          performance.bones("a", t).get(frame.bone)!,
        ).point;
      };
      let height: { low: number; high: number } = {
        low: Infinity,
        high: -Infinity,
      };
      let path: number = 0;
      for (let t: number = from; t <= to + 1e-9; t += 1 / 24) {
        const p: IAutoMovieVector3 = palm(t);
        height = {
          low: Math.min(height.low, p.y - top),
          high: Math.max(height.high, p.y - top),
        };
        const want: IAutoMovieVector3 = wipe.circle(
          centre,
          m.forearm / 4,
          0,
          3,
          minimumJerk((t - from) / (to - from)).s,
        );
        path = Math.max(path, Math.hypot(p.x - want.x, p.z - want.z));
      }
      out.push({
        name: `household-${label}${suffix}`,
        times: FamilyCaseKit.times(performance, 0.25, [[from, "strokeStart"]]),
        performers: [FamilyCaseKit.figure(performance, who.man)],
        boxes: [
          {
            centre: { x: -0.15, y: top / 2, z: 0.6 },
            half: { x: 0.4, y: top / 2, z: 0.3 },
            color: 0x9aa4b0,
          },
        ],
        verdicts: [
          ...everydayVerdicts.standard(performance, "a", who.body),
          {
            name: "palm on the counter while wiping",
            passed: height.low >= -0.01 && height.high <= 0.01,
            detail: `${(height.low * 1000).toFixed(1)} to ${(height.high * 1000).toFixed(1)} mm (band -10.0 to 10.0 mm)`,
          },
          everydayVerdicts.within(
            "palm on the planned circle",
            path,
            0.01,
            "mm",
          ),
        ],
      });
    }
  }
  return out;
}
