import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { seated } from "../../everyday/seated";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanHand } from "../../posture/HumanHand";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { everydayCaseKit } from "./everydayCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * The seat, bend and step cases of `everydayCases` (`everyday-seat`,
 * `everyday-bend` and `everyday-step`), with the verdicts
 * `everydayCases` lists.
 *
 * @param c The body's case context.
 * @param wants Whether a family is wanted.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cases and where their verdicts are listed.
 * @evidence contracts/development/implementation.md#principled-implementation Each case runs the real performance and measures contacts on its displayed poses.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One block per family.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Instants come from the plans' events.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function everydayPostureCases(
  c: everydayCaseKit.IContext,
  wants: (name: string) => boolean,
): IMotionCaptureCase[] {
  const { man, body, suffix } = c;
  const out: IMotionCaptureCase[] = [];
  const within = everydayVerdicts.within;
  const { figure, event } = everydayCaseKit;
  const one = (chain: HumanChain): HumanPerformance =>
    everydayCaseKit.one(c, chain);
  if (wants("seat")) {
    const seat: seated.ISeat = {
      at: {
        x: 0,
        y: seated.popliteal(body),
        z: body.rest.get("leftFoot")!.z - 0.1,
      },
      yaw: 0,
      depth: 0.45,
    };
    const performance: HumanPerformance = one(
      HumanChain.subject("a")
        .sit({ seat, seconds: 0.5 })
        .shift({ by: 0.12 })
        .rise(),
    );
    const [sit, shift, rise] = performance.segments("a");
    const contact: number = event(performance, "a", 0, "seatContact");
    const socket = (t: number): IAutoMovieVector3 =>
      resolveAutoMovieHumanoidSurfaces.place(
        body.surfaces.sockets.seat,
        performance.bones("a", t).get(body.surfaces.sockets.seat.bone)!,
      ).point;
    const thighs = (t: number): number => {
      const b = performance.bones("a", t);
      let low: number = Infinity;
      for (const side of ["left", "right"] as const)
        for (let k: number = 0; k <= 20; k++) {
          const p: IAutoMovieVector3 = Vector3.lerp(
            b.get(`${side}UpperLeg`)!.worldPosition,
            b.get(`${side}LowerLeg`)!.worldPosition,
            k / 20,
          );
          if (p.z <= seat.at.z && p.z >= seat.at.z - seat.depth!)
            low = Math.min(low, p.y - body.measure.thighRadius - seat.at.y);
        }
      return low;
    };
    out.push({
      name: `everyday-seat${suffix}`,
      times: [
        { seconds: 0, label: "standing" },
        { seconds: contact / 2, label: "lowering" },
        { seconds: contact, label: "seat contact" },
        { seconds: sit!.end, label: "seated" },
        { seconds: (shift!.entryTime + shift!.end) / 2, label: "shifting" },
        { seconds: event(performance, "a", 2, "seatOff"), label: "seat off" },
        {
          seconds: event(performance, "a", 2, "standing"),
          label: "standing",
        },
        { seconds: rise!.end, label: "end" },
      ],
      performers: [figure(performance, "a", man)],
      boxes: [
        {
          centre: {
            x: seat.at.x + 0.1,
            y: seat.at.y / 2,
            z: seat.at.z - 0.225,
          },
          half: { x: 0.45, y: seat.at.y / 2, z: 0.225 },
          color: 0x9a7b55,
        },
      ],
      verdicts: [
        within(
          "seated body on the seat at contact",
          Math.abs(Math.min(socket(contact).y - seat.at.y, thighs(contact))),
          0.015,
          "mm",
        ),
        within(
          "seated body on the seat while seated",
          Math.abs(Math.min(socket(sit!.end).y - seat.at.y, thighs(sit!.end))),
          0.015,
          "mm",
        ),
        within(
          "thighs not inside the seat",
          Math.max(0, -thighs(sit!.end)),
          0.01,
          "mm",
        ),
        {
          name: "extrapolated centre of mass over the feet at seat-off",
          passed:
            everydayVerdicts.stability(
              performance,
              "a",
              body,
              event(performance, "a", 2, "seatOff"),
            ) >= 0,
          detail: `${(everydayVerdicts.stability(performance, "a", body, event(performance, "a", 2, "seatOff")) * 1000).toFixed(1)} mm margin`,
        },
        ...everydayVerdicts.standard(performance, "a", body),
      ],
    });
  }

  if (wants("bend")) {
    const strategies = ["stoop", "semiSquat", "squat"] as const;
    const points: Record<(typeof strategies)[number], IAutoMovieVector3> = {
      stoop: {
        x: -0.15,
        y: body.measure.ankleHeight + 0.6 * body.measure.shank,
        z: 0.45,
      },
      semiSquat: {
        x: -0.15,
        y: body.measure.ankleHeight + 0.2 * body.measure.shank,
        z: 0.3,
      },
      squat: { x: -0.15, y: 0, z: 0.3 },
    };
    let chain: HumanChain = HumanChain.subject("a");
    for (const strategy of strategies)
      chain = chain.bend({
        toward: { kind: "point", at: points[strategy], frame: "world" },
        strategy,
      });
    const performance: HumanPerformance = one(chain);
    const verdicts: IMotionCaptureCase.IVerdict[] = everydayVerdicts.standard(
      performance,
      "a",
      body,
    );
    strategies.forEach((strategy, i: number): void => {
      const t: number = event(performance, "a", i, "deepest");
      verdicts.push(
        within(
          `${strategy} palm at the point`,
          Vector3.length(
            Vector3.subtract(
              HumanHand.frame(
                body,
                performance.bones("a", t),
                "right",
                "palm",
                "flat",
              ).point,
              points[strategy],
            ),
          ),
          0.015,
          "mm",
        ),
      );
      const margin: number = everydayVerdicts.stability(
        performance,
        "a",
        body,
        t,
      );
      verdicts.push({
        name: `${strategy} balanced over the feet`,
        passed: margin >= 0,
        detail: `${(margin * 1000).toFixed(1)} mm margin`,
      });
    });
    out.push({
      name: `everyday-bend${suffix}`,
      times: strategies.map((strategy, i: number) => ({
        seconds: event(performance, "a", i, "deepest"),
        label: strategy,
      })),
      performers: [figure(performance, "a", man)],
      targets: strategies.map((strategy) => ({
        at: points[strategy],
        radius: 0.03,
        color: 0xd04040,
      })),
      verdicts,
    });
  }

  if (wants("step")) {
    const box = { at: { x: 0, y: 0, z: 0.35 }, height: 0.3, depth: 0.25 };
    const performance: HumanPerformance = one(
      HumanChain.subject("a").stepOver({ obstacle: box }),
    );
    const crossing = performance.segments("a")[0]!;
    const span: number = crossing.end - crossing.start;
    let clearance: number = Infinity;
    for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 96)
      for (const p of HumanFoot.base(body, performance.bones("a", t)))
        if (p.z > box.at.z && p.z < box.at.z + box.depth)
          clearance = Math.min(clearance, p.y - box.height);
    out.push({
      name: `everyday-step${suffix}`,
      times: [0, 0.2, 0.3, 0.4, 0.5, 0.7, 0.8, 0.9, 1].map((u: number) => ({
        seconds: crossing.start + u * span,
        label: `${Math.round(u * 100)} %`,
      })),
      performers: [figure(performance, "a", man)],
      boxes: [
        {
          centre: { x: 0, y: box.height / 2, z: box.at.z + box.depth / 2 },
          half: { x: 0.4, y: box.height / 2, z: box.depth / 2 },
          color: 0x9a7b55,
        },
      ],
      verdicts: [
        {
          name: "sole clearance over the box",
          passed: clearance >= 0.05,
          detail: `${(clearance * 1000).toFixed(1)} mm (at least 50 mm)`,
        },
        ...everydayVerdicts.standard(performance, "a", body),
      ],
    });
  }
  return out;
}
