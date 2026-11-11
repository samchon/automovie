import { HumanChain } from "../../HumanChain";
import type { crouch } from "../../everyday/crouch";
import type { kneel } from "../../everyday/kneel";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the crouch, squat and kneel family (#3215), each performed
 * alone from quiet standing on the polygon man.
 *
 * Every case reports foot slip at most 5 mm in the plant windows, each
 * planted foot within 5 mm of the floor and no range-of-motion overshoot.
 * Beyond that:
 *
 * - `crouch-partial` and `crouch-full`: the knee flexion at `lowest` inside
 *   the depth's band (the high-flexion band of 140 to 157 degrees for the
 *   full squat, Hemmerich et al. 2006 and Acker et al. 2011; below 140 for the
 *   partial one), and the dynamic margin of stability not negative through
 *   the whole action (Hof et al. 2005).
 * - `kneel-one`, `kneel-both` and `kneel-sitBack`: at `kneeContact` the
 *   kneeling shank's lowest collider point within -10 to +15 mm of the floor
 *   and the knee joint within 15 mm horizontally of the hip joint above it,
 *   its planned floor point; the kneeling shank never below the floor by more
 *   than 10 mm; the margin of stability not negative from the start to the
 *   end of the step back (before the knee bears); and for sitting back the
 *   knee flexion at `seatOnHeels` inside the high-flexion band.
 *
 * @param bodies The sweep bodies to run each case on; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case and its verdicts with their bounds and sources.
 * @evidence contracts/development/implementation.md#principled-implementation Each case runs the real performance and measures its displayed bones.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One block per law over the shared case kit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Verdicts read displayed poses, never the laws' goals.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case and body.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function crouchCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;

    for (const depth of ["partial", "full"] as const) {
      const params: crouch.IParams = { depth };
      const performance: HumanPerformance = FamilyCaseKit.perform(
        "crouch",
        [{ subject: "a", body: who.body }],
        HumanChain.subject("a").act("crouch", params),
      );
      const lowest: number = FamilyCaseKit.event(performance, "lowest");
      const knee: number = Math.max(
        FamilyCaseKit.angle(performance, "a", lowest, "leftLowerLeg"),
        FamilyCaseKit.angle(performance, "a", lowest, "rightLowerLeg"),
      );
      const margin = FamilyCaseKit.stability(
        performance,
        "a",
        who.body,
        0,
        performance.duration,
      );
      out.push({
        name: `crouch-${depth}${suffix}`,
        times: FamilyCaseKit.times(performance, 0.2, [[lowest, "lowest"]]),
        performers: [FamilyCaseKit.figure(performance, who.man)],
        verdicts: [
          ...common(performance, who),
          depth === "full"
            ? FamilyCaseKit.band(
                "knee flexion at lowest",
                knee,
                140,
                157,
                "deg",
              )
            : FamilyCaseKit.band("knee flexion at lowest", knee, 0, 140, "deg"),
          {
            name: "margin of stability through the crouch",
            passed: margin.value >= 0,
            detail: `${(margin.value * 1000).toFixed(1)} mm at ${margin.at.toFixed(2)} s`,
          },
        ],
      });
    }

    for (const kind of ["one", "both", "sitBack"] as const) {
      const params: kneel.IParams = { kind, knee: "right" };
      const performance: HumanPerformance = FamilyCaseKit.perform(
        "kneel",
        [{ subject: "a", body: who.body }],
        HumanChain.subject("a").act("kneel", params),
      );
      const contact: number = FamilyCaseKit.event(performance, "kneeContact");
      const settled: number = FamilyCaseKit.event(performance, "settled");
      const bones = performance.bones("a", contact);
      const kneeAt = bones.get("rightLowerLeg")!.worldPosition;
      const hipAt = bones.get("rightUpperLeg")!.worldPosition;
      const shank = (b: string): boolean => b === "rightLowerLeg";
      let deepest: number = Infinity;
      for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 24)
        deepest = Math.min(
          deepest,
          FamilyCaseKit.lowest(performance, who.body, "a", t, shank),
        );
      const margin = FamilyCaseKit.stability(
        performance,
        "a",
        who.body,
        0,
        FamilyCaseKit.event(performance, "lowering"),
      );
      const named: [number, string][] = [
        [contact, "kneeContact"],
        [settled, "settled"],
      ];
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...common(performance, who),
        FamilyCaseKit.band(
          "kneeling shank's lowest point at kneeContact",
          FamilyCaseKit.lowest(performance, who.body, "a", contact, shank),
          -0.01,
          0.015,
          "mm",
        ),
        everydayVerdicts.within(
          "knee under its hip at kneeContact",
          Math.hypot(kneeAt.x - hipAt.x, kneeAt.z - hipAt.z),
          0.015,
          "mm",
        ),
        everydayVerdicts.within(
          "kneeling shank below the floor",
          Math.max(0, -deepest),
          0.01,
          "mm",
        ),
        {
          name: "margin of stability through the step back",
          passed: margin.value >= 0,
          detail: `${(margin.value * 1000).toFixed(1)} mm at ${margin.at.toFixed(2)} s`,
        },
      ];
      if (kind === "sitBack") {
        const seat: number = FamilyCaseKit.event(performance, "seatOnHeels");
        named.push([seat, "seatOnHeels"]);
        verdicts.push(
          FamilyCaseKit.band(
            "knee flexion sitting back",
            FamilyCaseKit.angle(performance, "a", seat, "rightLowerLeg"),
            140,
            157,
            "deg",
          ),
        );
      }
      out.push({
        name: `kneel-${kind}${suffix}`,
        times: FamilyCaseKit.times(performance, 0.25, named),
        performers: [FamilyCaseKit.figure(performance, who.man)],
        verdicts,
      });
    }
  }
  return out;
}

/** Slip, ROM and the planted feet's height off the floor. */
function common(
  performance: HumanPerformance,
  who: FamilyCaseKit.IBody,
): IMotionCaptureCase.IVerdict[] {
  const off = everydayVerdicts.grounded(performance, "a", who.body);
  const grounded: IMotionCaptureCase.IVerdict = everydayVerdicts.within(
    "a planted foot off the floor",
    off.value,
    0.005,
    "mm",
  );
  return [
    ...everydayVerdicts.standard(performance, "a", who.body),
    { ...grounded, detail: `${grounded.detail}, worst in ${off.where}` },
  ];
}
