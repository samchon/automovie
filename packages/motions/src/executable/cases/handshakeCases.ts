import {
  DEFAULT_HUMANOID_ROM,
  Vector3,
  jointRomOvershoot,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { handshake } from "../../handling/handshake";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanHand } from "../../posture/HumanHand";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { HandOverlap } from "./HandOverlap";

/**
 * Capture cases of the handshake on the polygon man, for what the numeric
 * tests cannot show: whether the reach reads as reaching for a hand, whether
 * the fingers wrap the partner's hand, and whether the pump reads.
 *
 * `handling-handshake-<pair>`: two people of `MotionBodies.SWEEP`, standing
 * at `handshake.gap` (where their offering arms meet), shake hands. The pairs
 * span the sweep's stature, girth and arm-length extremes: the tall man with
 * the small woman, two average men, two small women, the large man with the
 * small woman, the long-armed man with the short-armed man, and the broad man
 * with the narrow man. Instants at the start, the reach's peak aperture band
 * (60 and 70 % of the reach), the clasp, the pump's top and bottom, the
 * release and the end. Both right wrists leave trails and the meeting point
 * is marked. Verdicts: the palms meet within 15 mm at the clasp and stay
 * within 10 mm through the pump, the chests stand in Hall's personal zone, no
 * right-hand phalanx or forearm capsule enters the other's by more than 10 mm
 * (`HandOverlap`, the palm boxes not measured), every joint stays in the
 * default range, and the ankles move at most 5 mm.
 *
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the pairs, the instants, the overlays and the verdicts.
 * @evidence contracts/development/implementation.md#principled-implementation Each case runs the real performance and samples its displayed poses at the plan's own events.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One builder over a pair table, the overlap measure shared with the handover cases.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Instants come from the plan's events; verdicts read forward kinematics, not the law's goals.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per pair; poses are sampled at drawn instants and trail points.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function handshakeCases(): IMotionCaptureCase[] {
  return PAIRS.map(([first, second]): IMotionCaptureCase => {
    const one: humanPolygonMan.IPolygonMan = MotionBodies.population(first);
    const two: humanPolygonMan.IPolygonMan = MotionBodies.population(second);
    const a: IHumanBody = createHumanBody(one.body.skeleton, one.body.profile);
    const b: IHumanBody = createHumanBody(two.body.skeleton, two.body.profile);

    // The partners stand where their offering arms meet.
    const D: number =
      handshake.gap(a, b) +
      handshake.stance(a).sternum +
      handshake.stance(b).sternum;
    const performance: HumanPerformance = new HumanPerformance({
      seed: `handling-handshake-${first}-${second}`,
      performers: [
        {
          subject: "a",
          body: a,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: b,
          at: { x: 0, y: 0, z: D },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.pair(
        HumanChain.subject("a").stand({ seconds: 0.4 }),
        HumanChain.subject("b").stand({ seconds: 0.4 }),
      ).handshake().node,
    });
    const segment = performance
      .segments("a")
      .find((x) => x.name === "handshake")!;
    const at = (event: string): number =>
      segment.start +
      segment.plan.events.find((e) => e.name === event)!.share *
        segment.plan.duration;
    const clasp: number = at("clasp");
    const release: number = at("release");
    const pump: number = 1 / handshake.FREQUENCY;
    const palm = (
      subject: string,
      body: IHumanBody,
      t: number,
    ): IAutoMovieVector3 =>
      HumanHand.frame(
        body,
        performance.bones(subject, t),
        "right",
        "palm",
        "flat",
      ).point;
    const wrist = (subject: string, t: number): IAutoMovieVector3 =>
      performance.bones(subject, t).get("rightHand")!.worldPosition;
    const samples: number[] = [];
    for (
      let t: number = segment.entryTime;
      t <= segment.end + 1e-9;
      t += 1 / 48
    )
      samples.push(t);
    let drift: number = 0;
    let deepest: number = Infinity;
    let overshoot: number = 0;
    for (const t of samples) {
      if (t >= clasp && t <= release) {
        drift = Math.max(drift, distance(palm("a", a, t), palm("b", b, t)));
        deepest = Math.min(
          deepest,
          HandOverlap.deepest(
            a,
            performance.bones("a", t),
            b,
            performance.bones("b", t),
          ),
        );
      }
      for (const subject of ["a", "b"])
        for (const j of performance.pose(subject, t).joints) {
          const c = DEFAULT_HUMANOID_ROM[j.bone];
          if (c !== undefined)
            overshoot = Math.max(overshoot, jointRomOvershoot(j, c));
        }
    }
    const meet: number = distance(palm("a", a, clasp), palm("b", b, clasp));
    const sternum = (subject: string, body: IHumanBody): IAutoMovieVector3 =>
      resolveAutoMovieHumanoidSurfaces.place(
        body.surfaces.regions.sternum,
        performance
          .bones(subject, clasp)
          .get(body.surfaces.regions.sternum.bone)!,
      ).point;
    const chest: number = Math.hypot(
      sternum("a", a).x - sternum("b", b).x,
      sternum("a", a).z - sternum("b", b).z,
    );
    let slip: number = 0;
    for (const subject of ["a", "b"])
      for (const foot of ["leftFoot", "rightFoot"] as const) {
        const from: IAutoMovieVector3 = performance
          .bones(subject, segment.entryTime)
          .get(foot)!.worldPosition;
        for (const t of samples)
          slip = Math.max(
            slip,
            distance(
              performance.bones(subject, t).get(foot)!.worldPosition,
              from,
            ),
          );
      }
    return {
      name: `handling-handshake-${first}-${second}`,
      times: [
        { seconds: segment.entryTime, label: "start" },
        {
          seconds: segment.entryTime + 0.6 * (clasp - segment.entryTime),
          label: "reach 60 %",
        },
        {
          seconds: segment.entryTime + 0.7 * (clasp - segment.entryTime),
          label: "reach 70 %",
        },
        { seconds: clasp, label: "clasp" },
        { seconds: clasp + 0.25 * pump, label: "pump top" },
        { seconds: clasp + 0.75 * pump, label: "pump bottom" },
        { seconds: release, label: "release" },
        { seconds: segment.end, label: "end" },
      ],
      performers: [
        {
          id: "a",
          body: one.body,
          pose: (t: number) => performance.pose("a", t),
        },
        {
          id: "b",
          body: two.body,
          pose: (t: number) => performance.pose("b", t),
          color: 0x7a8fa6,
        },
      ],
      trails: [
        {
          color: 0xd04040,
          points: samples.map((t: number): IAutoMovieVector3 => wrist("a", t)),
        },
        {
          color: 0x3a6ea5,
          points: samples.map((t: number): IAutoMovieVector3 => wrist("b", t)),
        },
      ],
      targets: [{ at: palm("a", a, clasp), radius: 0.015, color: 0x40a040 }],
      verdicts: [
        {
          name: "palms meet within 15 mm at the clasp",
          passed: meet <= 0.015,
          detail: `${(meet * 1000).toFixed(1)} mm`,
        },
        {
          name: "palms stay within 10 mm through the pump",
          passed: drift <= 0.01,
          detail: `${(drift * 1000).toFixed(1)} mm`,
        },
        {
          name: "partners stand in the personal zone (chest gap 0.46 to 1.2 m, Hall 1966)",
          passed: chest >= 0.46 && chest <= 1.2,
          detail: `${chest.toFixed(3)} m`,
        },
        {
          name: "no hand or forearm capsule enters the other's by more than 10 mm",
          passed: deepest >= -0.01,
          detail: `${(deepest * 1000).toFixed(1)} mm`,
        },
        {
          name: "every joint inside the default range of motion",
          passed: overshoot <= 1e-6,
          detail: `${overshoot.toFixed(4)} deg`,
        },
        {
          name: "ankles move at most 5 mm",
          passed: slip <= 0.005,
          detail: `${(slip * 1000).toFixed(2)} mm`,
        },
      ],
    };
  });
}

/** The partner pairs, first and second, by `MotionBodies.SWEEP` name. */
const PAIRS: readonly (readonly [string, string])[] = [
  ["m-tall", "f-small"],
  ["m-average", "m-average"],
  ["f-small", "f-small"],
  ["m-large", "f-small"],
  ["m-long-armed", "m-short-armed"],
  ["m-broad", "m-narrow"],
];

/** Distance between two points, metres. */
function distance(p: IAutoMovieVector3, q: IAutoMovieVector3): number {
  return Vector3.length(Vector3.subtract(p, q));
}
