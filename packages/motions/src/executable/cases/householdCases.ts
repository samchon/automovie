import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanOperate,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanWipe,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { AutoMovieMotionInterval } from "../../compose/AutoMovieMotionInterval";
import { wipe } from "../../tasks/wipe";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./internal/everydayVerdicts";

/** The record of `IHouseholdCasesHeight`'s site. */
type IHouseholdCasesHeight = { low: number; high: number };

/**
 * Capture cases of the household family, from quiet standing with the right
 * hand, at a counter 225 mm below the elbow (Li, Chang and Zhang 2024's
 * preferred band of 200 to 250 mm):
 *
 * - `household-wipe`: three circles wiping the counter;
 * - `household-drawer-wipe`: a composed task, a drawer under the counter pulled
 *   0.15 m open, which stops its handle short of the thighs, then the counter
 *   wiped.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion overshoot,
 * and that from `strokeStart` to `strokeEnd` of the wipe the palm socket lies
 * within -10 to +10 mm of the counter's top and within 10 mm of the wipe's
 * planned circle (provisional bounds at decision 11's accuracy).
 *
 * @param bodies The sweep bodies; `m-average` when absent.
 * @returns The cases.
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
    const wiping: IAutoMovieMotionHumanWipe.IParams = {
      on: { kind: "point", at: centre, frame: "world" },
      count: 3,
    };
    const drawer: IAutoMovieMotionHumanOperate.IParams = {
      kind: {
        kind: "slider",
        at: {
          kind: "point",
          at: { x: -0.15, y: top - 0.12, z: 0.3 },
          frame: "world",
          normal: { x: 0, y: 0, z: -1 },
        },
        travel: 0.15,
      },
    };
    const chains: [string, IAutoMovieMotionHumanChain][] = [
      ["wipe", HumanChain.subject("a").act("wipe", wiping)],
      [
        "drawer-wipe",
        HumanChain.subject("a").act("operate", drawer).act("wipe", wiping),
      ],
    ];
    for (const [label, chain] of chains) {
      const performance: IAutoMovieMotionHumanPerformance =
        FamilyCaseKit.perform(
          "household",
          [{ subject: "a", body: who.body }],
          chain.node,
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
      let height: IHouseholdCasesHeight = {
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
          AutoMovieMotionInterval.progress(from, to, t),
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
