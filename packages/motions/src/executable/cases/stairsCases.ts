import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";
import { climbStairs } from "../../terrain/climbStairs";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the stairs family (#3213): a four-tread flight of 170 mm
 * risers and 280 mm treads (2010 ADA 504.2), climbed up step over step, down
 * step over step, and up step by step, each from quiet standing before the
 * first nosing.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion overshoot.
 * Beyond that, on the displayed sole sockets (heel, ball, toe) against the
 * flight's surface:
 *
 * - every swinging foot's sockets clear each nosing line they pass over by at
 *   least 20 mm (the issue's provisional toe clearance);
 * - no socket ever lies more than 10 mm under the floor, a tread or a riser's
 *   top (decision 11);
 * - a planted foot's lowest socket stays within 5 mm of the surface under it.
 *
 * @param bodies The sweep bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case and its verdicts with their bounds and sources.
 * @evidence contracts/development/implementation.md#principled-implementation Measures displayed sockets against the flight's own surface function.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over three flights over the shared kit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Verdicts read displayed poses, never the law's footprints.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in frames.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function stairsCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    const flights: [string, climbStairs.IParams][] = [
      ["up", { count: 4, direction: "up" }],
      ["down", { count: 4, direction: "down" }],
      ["up-step-by-step", { count: 4, direction: "up", pattern: "stepByStep" }],
    ];
    for (const [label, params] of flights) {
      const performance: HumanPerformance = FamilyCaseKit.perform(
        "stairs",
        [{ subject: "a", body: who.body }],
        HumanChain.subject("a").act("climbStairs", params),
      );
      const segment = performance.segments("a")[0]!;
      const flight: climbStairs.IFlight = climbStairs.flight(
        who.body,
        segment.plan.posture(0),
        params,
      );
      const planted = (side: "left" | "right", t: number): boolean =>
        segment.plan.contacts.some(
          (c) =>
            c.part === `${side}Foot` &&
            c.kind === "plant" &&
            t >= segment.start + c.from * segment.plan.duration - 1e-6 &&
            t <= segment.start + c.to * segment.plan.duration + 1e-6,
        );
      const edges: number[] = Array.from(
        { length: flight.count },
        (_, i: number): number => flight.first + i * flight.tread,
      );
      let nosing: { value: number; where: string } = {
        value: Infinity,
        where: "none",
      };
      let under: { value: number; where: string } = {
        value: Infinity,
        where: "none",
      };
      let stance: { value: number; where: string } = {
        value: 0,
        where: "none",
      };
      for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 24) {
        const bones = performance.bones("a", t);
        for (const side of ["left", "right"] as const) {
          const sockets = HumanFoot.sockets(who.body, bones, side);
          const gaps = sockets.map((s) => {
            const local: IAutoMovieVector3 = HumanFrame.local(
              flight.frame,
              s.point,
            );
            return {
              socket: s.socket,
              y: s.point.y,
              z: local.z,
              gap: s.point.y - climbStairs.surface(flight, local.z),
            };
          });
          for (const g of gaps)
            if (g.gap < under.value)
              under = {
                value: g.gap,
                where: `${side} ${g.socket} at ${t.toFixed(2)} s`,
              };
          if (planted(side, t)) {
            const low: number = Math.min(...gaps.map((g) => g.gap));
            if (Math.abs(low) > stance.value)
              stance = {
                value: Math.abs(low),
                where: `${side} at ${t.toFixed(2)} s`,
              };
          } else
            for (const g of gaps)
              for (const edge of edges)
                if (Math.abs(g.z - edge) <= 0.02) {
                  const top: number = Math.max(
                    climbStairs.surface(flight, edge - 0.001),
                    climbStairs.surface(flight, edge + 0.001),
                  );
                  const clear: number = g.y - top;
                  if (clear < nosing.value)
                    nosing = {
                      value: clear,
                      where: `${side} ${g.socket} at ${t.toFixed(2)} s`,
                    };
                }
        }
      }
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...everydayVerdicts.standard(performance, "a", who.body),
        {
          name: "swing sole clears every nosing by 20 mm",
          passed: nosing.value >= 0.02,
          detail: `${(nosing.value * 1000).toFixed(1)} mm, worst ${nosing.where}`,
        },
        {
          name: "no sole socket under the flight by more than 10 mm",
          passed: under.value >= -0.01,
          detail: `${(under.value * 1000).toFixed(1)} mm, worst ${under.where}`,
        },
        {
          name: "planted foot on its surface within 5 mm",
          passed: stance.value <= 0.005,
          detail: `${(stance.value * 1000).toFixed(1)} mm, worst ${stance.where}`,
        },
      ];
      out.push({
        name: `stairs-${label}${suffix}`,
        times: FamilyCaseKit.times(performance, 0.25, [
          [FamilyCaseKit.event(performance, "treadContact1"), "treadContact1"],
          [FamilyCaseKit.event(performance, "arrived"), "arrived"],
        ]),
        performers: [FamilyCaseKit.figure(performance, who.man)],
        boxes: boxes(flight),
        verdicts,
      });
    }
  }
  return out;
}

/** The flight's treads, its top landing and, going down, the floor behind it. */
function boxes(
  flight: climbStairs.IFlight,
): NonNullable<IMotionCaptureCase["boxes"]> {
  const out: NonNullable<IMotionCaptureCase["boxes"]> = [];
  const sign: number = flight.direction === "up" ? 1 : -1;
  const bottom: number = Math.min(0, sign * flight.count * flight.riser) - 0.02;
  const box = (z0: number, z1: number, top: number): void => {
    const lo: number = Math.min(top, bottom);
    out.push({
      centre: HumanFrame.point(flight.frame, {
        x: 0,
        y: (top + lo) / 2,
        z: (z0 + z1) / 2,
      }),
      half: { x: 0.45, y: Math.max(0.005, (top - lo) / 2), z: (z1 - z0) / 2 },
      color: 0x9aa4b0,
    });
  };
  for (let i: number = 1; i <= flight.count; i++)
    box(
      flight.first + (i - 1) * flight.tread,
      flight.first + (i === flight.count ? i + 1 : i) * flight.tread,
      sign * i * flight.riser,
    );
  if (sign < 0) box(flight.first - 0.8, flight.first, 0);
  return out;
}
