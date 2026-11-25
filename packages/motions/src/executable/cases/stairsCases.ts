import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanClimbStairs,
  IAutoMovieMotionHumanClimbStairsFlight,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";
import { climbStairs } from "../../terrain/climbStairs";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";
import { stairsCaseBoxes } from "./stairsCaseBoxes";

/** The record of `IStairsCasesStance`'s site. */
type IStairsCasesStance = { value: number; where: string };

/** The record of `IStairsCasesUnder`'s site. */
type IStairsCasesUnder = { value: number; where: string };

/** The record of `IStairsCasesNosing`'s site. */
type IStairsCasesNosing = { value: number; where: string };

/**
 * Capture cases of the stairs family: a four-tread flight of 170 mm risers and
 * 280 mm treads (2010 ADA 504.2), climbed up step over step, down step over
 * step, and up step by step, each from quiet standing before the first nosing.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion overshoot.
 * Beyond that, on the displayed sole sockets (heel, ball, toe) against the
 * flight's surface:
 *
 * - Every swinging foot's sockets clear each nosing line they pass over by at
 *   least 20 mm (the issue's provisional toe clearance);
 * - No socket ever lies more than 10 mm under the floor, a tread or a riser's top
 *   (decision 11);
 * - A planted foot's lowest socket stays within 5 mm of the surface under it.
 *
 * @param bodies The sweep bodies; `m-average` when absent.
 * @returns The cases.
 */
export function stairsCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    const flights: [string, IAutoMovieMotionHumanClimbStairs.IParams][] = [
      ["up", { count: 4, direction: "up" }],
      ["down", { count: 4, direction: "down" }],
      ["up-step-by-step", { count: 4, direction: "up", pattern: "stepByStep" }],
    ];
    for (const [label, params] of flights) {
      const performance: IAutoMovieMotionHumanPerformance =
        FamilyCaseKit.perform(
          "stairs",
          [{ subject: "a", body: who.body }],
          HumanChain.subject("a").act("climbStairs", params).node,
        );
      const segment = performance.segments("a")[0]!;
      const flight: IAutoMovieMotionHumanClimbStairsFlight.IFlight =
        climbStairs.flight(who.body, segment.plan.posture(0), params);
      const planted = (side: AutoMovieHumanSide, t: number): boolean =>
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
      let nosing: IStairsCasesNosing = {
        value: Infinity,
        where: "none",
      };
      let under: IStairsCasesUnder = {
        value: Infinity,
        where: "none",
      };
      let stance: IStairsCasesStance = {
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
        boxes: stairsCaseBoxes(flight),
        verdicts,
      });
    }
  }
  return out;
}
