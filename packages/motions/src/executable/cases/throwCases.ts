import {
  type AutoMovieComposition,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidSocket,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import type { IHumanProp } from "../../perform/IHumanProp";
import { catchObject } from "../../throwing/catchObject";
import { throwObject } from "../../throwing/throwObject";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the throw and catch family (#3232): performer `a` throws
 * to performer `b` standing facing it, overarm over 6 m, underarm over 4 m
 * and a toss over 2.5 m, aimed at the place ahead of `b` where its catch
 * meets the path; `b` catches with two hands.
 *
 * Every case reports each performer's foot slip at most 5 mm and no
 * range-of-motion overshoot. Beyond that:
 *
 * - the drag-free path launched from `a`'s displayed grip socket at
 *   `release`, with the socket's displayed velocity (a central difference
 *   over 1/240 s), passes within 10 mm of the target (decision 11's
 *   declared accuracy);
 * - the displayed release speed is within 10 % of the planned launch speed
 *   (provisional);
 * - at `contact` each of `b`'s palm sockets is within 15 mm of the object's
 *   surface (the issue's hand-meets-object bound), and stays within it until
 *   `held`.
 *
 * @param bodies The sweep bodies, each throwing to and catching from itself; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case and its verdicts with their bounds and sources.
 * @evidence contracts/development/implementation.md#principled-implementation Measures displayed sockets against the planned path.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over three styles over the shared kit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The release state is read off displayed bones, never the plan's launch.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function throwCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  // The ball caught: a handball's 0.11 m radius as its grip's aperture, the
  // contact `createBall` declares, lying at the thrower's feet.
  const handball: IHumanProp = {
    subject: "ball",
    frame: {
      position: { x: 0, y: 0.11, z: 0.3 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    affordances: [
      {
        id: "grip",
        kind: "handle",
        frame: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        extent: null,
        grip: "power",
        aperture: 0.22,
      },
    ],
  };
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    const m = who.body.measure;
    const styles: [throwObject.Style, number][] = [
      ["overarm", 6],
      ["underarm", 4],
      ["toss", 2.5],
    ];
    for (const [style, distance] of styles) {
      const target: IAutoMovieVector3 = {
        x: 0,
        y: m.chestHeight,
        z: distance - catchObject.REACH * (m.upperArm + m.forearm),
      };
      const composition: AutoMovieComposition = {
        kind: "parallel",
        parts: [
          HumanChain.subject("a").act(
            "throwObject",
            { at: { kind: "point", at: target, frame: "world" }, style },
            "t1",
          ).node,
          HumanChain.subject("b").act("catchObject", {
            from: "t1",
            ball: "ball",
          }).node,
        ],
      };
      const performance: HumanPerformance = FamilyCaseKit.perform(
        "throw",
        [
          { subject: "a", body: who.body },
          {
            subject: "b",
            body: who.body,
            at: { x: 0, y: 0, z: distance },
            yaw: 180,
          },
        ],
        composition,
        [handball],
      );
      const thrown = performance.segments("a")[0]!;
      const caught = performance.segments("b")[0]!;
      const launch: throwObject.ILaunch = throwObject.of(thrown.plan)!;
      const release: number = FamilyCaseKit.event(performance, "release", "a");
      const contact: number = FamilyCaseKit.event(performance, "contact", "b");
      const held: number = FamilyCaseKit.event(performance, "held", "b");

      // The displayed launch: the grip socket and its velocity at release.
      const grip = (seconds: number): IAutoMovieVector3 =>
        socket(who.body, performance, "a", seconds, "gripRight");
      const h: number = 1 / 240;
      const from: IAutoMovieVector3 = grip(release);
      const velocity: IAutoMovieVector3 = Vector3.scale(
        Vector3.subtract(grip(release + h), grip(release - h)),
        1 / (2 * h),
      );
      let miss: number = Infinity;
      for (let u: number = 0; u <= 3; u += 1 / 2400)
        miss = Math.min(
          miss,
          Vector3.length(
            Vector3.subtract(
              throwObject.path({ ...launch, point: from, velocity }, u),
              target,
            ),
          ),
        );
      const planned: number = Vector3.length(launch.velocity);
      const shown: number = Vector3.length(velocity);

      // The catching palms against the object's surface.
      const object = (seconds: number): IAutoMovieVector3 =>
        (caught.plan as catchObject.IPlan).object(seconds - caught.start);
      const palmGap = (seconds: number): number =>
        Math.max(
          ...(["palmLeft", "palmRight"] as const).map((name) =>
            Math.abs(
              Vector3.length(
                Vector3.subtract(
                  socket(who.body, performance, "b", seconds, name),
                  object(seconds),
                ),
              ) - 0.11,
            ),
          ),
        );
      let kept: number = 0;
      for (let t: number = contact; t <= held + 1e-9; t += 1 / 24)
        kept = Math.max(kept, palmGap(t));

      const trail: IAutoMovieVector3[] = [];
      for (let u: number = 0; u <= contact - release + 1e-9; u += 0.02)
        trail.push(throwObject.path(launch, u));
      out.push({
        name: `throw-${style}${suffix}`,
        times: FamilyCaseKit.times(performance, 0.2, [
          [release, "release"],
          [contact, "contact"],
        ]),
        performers: [
          FamilyCaseKit.figure(performance, who.man, "a"),
          FamilyCaseKit.figure(performance, who.man, "b"),
        ],
        trails: [{ color: 0xd08020, points: trail }],
        targets: [{ at: target, radius: 0.03, color: 0xd04040 }],
        verdicts: [
          ...everydayVerdicts.standard(performance, "a", who.body),
          ...everydayVerdicts.standard(performance, "b", who.body),
          everydayVerdicts.within(
            "displayed launch passes the target",
            miss,
            0.01,
            "mm",
          ),
          {
            name: "displayed release speed within 10 % of the plan",
            passed: Math.abs(shown - planned) <= 0.1 * planned,
            detail: `${shown.toFixed(2)} m/s against ${planned.toFixed(2)} m/s`,
          },
          everydayVerdicts.within(
            "palms on the object at contact",
            palmGap(contact),
            0.015,
            "mm",
          ),
          everydayVerdicts.within(
            "palms on the object from contact to held",
            kept,
            0.015,
            "mm",
          ),
        ],
      });
    }
  }
  return out;
}

/** A body socket's displayed world point. */
function socket(
  body: IHumanBody,
  performance: HumanPerformance,
  subject: string,
  seconds: number,
  name: AutoMovieHumanoidSocket,
): IAutoMovieVector3 {
  const frame = body.surfaces.sockets[name];
  return resolveAutoMovieHumanoidSurfaces.place(
    frame,
    performance.bones(subject, seconds).get(frame.bone)!,
  ).point;
}
