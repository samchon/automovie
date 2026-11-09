import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { createHumanBody } from "../../body/createHumanBody";
import type { IHumanBody } from "../../body/IHumanBody";
import { handshake } from "../../handling/handshake";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanHand } from "../../posture/HumanHand";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";

/**
 * Capture cases of the handling laws on the polygon man, for what the
 * numeric tests cannot show: whether a reach reads as reaching for a hand,
 * whether the fingers wrap the partner's hand, and whether the pump reads.
 *
 * - `handling-handshake`: the tall man and the small woman, right shoulders
 *   1.7 of the smaller comfortable reach apart, shake hands; instants at the
 *   start, the reach's peak aperture band (60 and 70 % of the reach), the
 *   clasp, the pump's top and bottom, the release and the end. Both right
 *   wrists leave trails and the meeting point is marked. Verdicts: the palms
 *   meet within 15 mm at the clasp and stay within 10 mm through the pump.
 *   on the hands by drawing nothing else but the two people.
 *
 * @param family One case family (`handshake`) or all when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case, its instants, overlays and verdicts.
 * @evidence contracts/development/implementation.md#principled-implementation Each case runs the real performance and samples its displayed poses at the plan's own events.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One builder per family over a shared performance and figure helper.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Instants come from the plan's events; verdicts read forward kinematics, not the law's goals.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case; poses are sampled at drawn instants and trail points.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function handlingCases(family?: "handshake"): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  if (family === undefined || family === "handshake") {
    const tall: humanPolygonMan.IPolygonMan = MotionBodies.population("m-tall");
    const small: humanPolygonMan.IPolygonMan = MotionBodies.population("f-small");
    const a: IHumanBody = createHumanBody(tall.body.skeleton, tall.body.profile);
    const b: IHumanBody = createHumanBody(small.body.skeleton, small.body.profile);
    const reach: number = Math.min(handshake.arm(a, "right", { x: 0, y: 0, z: 0 }).reach, handshake.arm(b, "right", { x: 0, y: 0, z: 0 }).reach);
    const across: number = Math.abs(a.rest.get("rightUpperArm")!.x) + Math.abs(b.rest.get("rightUpperArm")!.x);
    const D: number = Math.sqrt((1.7 * reach) ** 2 - across * across);
    const performance: HumanPerformance = new HumanPerformance({
      seed: "handling-handshake",
      performers: [
        { subject: "a", body: a, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } },
        { subject: "b", body: b, at: { x: 0, y: 0, z: D }, yaw: 180, proficiency: { level: "trained" } },
      ],
      composition: HumanChain.pair(HumanChain.subject("a").stand({ seconds: 0.4 }), HumanChain.subject("b").stand({ seconds: 0.4 })).handshake().node,
    });
    const segment = performance.segments("a").find((s) => s.name === "handshake")!;
    const at = (event: string): number => segment.start + segment.plan.events.find((e) => e.name === event)!.share * segment.plan.duration;
    const clasp: number = at("clasp");
    const release: number = at("release");
    const pump: number = 1 / handshake.FREQUENCY;
    const palm = (subject: string, body: IHumanBody, t: number): IAutoMovieVector3 => HumanHand.frame(body, performance.bones(subject, t), "right", "palm", "flat").point;
    const wrist = (subject: string, t: number): IAutoMovieVector3 => performance.bones(subject, t).get("rightHand")!.worldPosition;
    const samples: number[] = [];
    for (let t: number = segment.entryTime; t <= segment.end + 1e-9; t += 1 / 48) samples.push(t);
    let drift: number = 0;
    for (const t of samples) if (t >= clasp && t <= release) drift = Math.max(drift, distance(palm("a", a, t), palm("b", b, t)));
    const meet: number = distance(palm("a", a, clasp), palm("b", b, clasp));
    const performers: IMotionCaptureCase.IPerformer[] = [
      { id: "a", body: tall.body, pose: (t: number) => performance.pose("a", t) },
      { id: "b", body: small.body, pose: (t: number) => performance.pose("b", t), color: 0x7a8fa6 },
    ];
    out.push({
      name: "handling-handshake",
      times: [
        { seconds: segment.entryTime, label: "start" },
        { seconds: segment.entryTime + 0.6 * (clasp - segment.entryTime), label: "reach 60 %" },
        { seconds: segment.entryTime + 0.7 * (clasp - segment.entryTime), label: "reach 70 %" },
        { seconds: clasp, label: "clasp" },
        { seconds: clasp + 0.25 * pump, label: "pump top" },
        { seconds: clasp + 0.75 * pump, label: "pump bottom" },
        { seconds: release, label: "release" },
        { seconds: segment.end, label: "end" },
      ],
      performers,
      trails: [
        { color: 0xd04040, points: samples.map((t: number): IAutoMovieVector3 => wrist("a", t)) },
        { color: 0x3a6ea5, points: samples.map((t: number): IAutoMovieVector3 => wrist("b", t)) },
      ],
      targets: [{ at: palm("a", a, clasp), radius: 0.015, color: 0x40a040 }],
      verdicts: [
        { name: "palms meet within 15 mm at the clasp", passed: meet <= 0.015, detail: `${(meet * 1000).toFixed(1)} mm` },
        { name: "palms stay within 10 mm through the pump", passed: drift <= 0.01, detail: `${(drift * 1000).toFixed(1)} mm` },
      ],
    });
  }
  return out;
}

/** Distance between two points, metres. */
function distance(p: IAutoMovieVector3, q: IAutoMovieVector3): number {
  return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
}
