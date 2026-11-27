import { Transform, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanThrowObjectForm,
  IAutoMovieMotionHumanThrowObjectLaunch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../chain/HumanChain";
import { catchObject } from "../../throwing/internal/catchObject";
import { readThrowObjectLaunch } from "../../throwing/internal/readThrowObjectLaunch";
import { throwObject } from "../../throwing/internal/throwObject";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./internal/everydayVerdicts";
import { motionCaseSocket } from "./internal/motionCaseSocket";

/**
 * Capture cases of the throw and catch family: performer `a` throws to
 * performer `b` standing facing it, overarm over 6 m, underarm over 4 m and a
 * toss over 2.5 m, aimed at the place ahead of `b` where its catch meets the
 * path; `b` catches with two hands.
 *
 * Every case reports each performer's foot slip at most 5 mm and no
 * range-of-motion overshoot. Beyond that:
 *
 * - The drag-free path launched from `a`'s displayed grip socket at `release`,
 *   with the socket's displayed velocity (a central difference over 1/240 s),
 *   passes within 10 mm of the target (decision 11's declared accuracy);
 * - The displayed release speed is within 10 % of the planned launch speed
 *   (provisional);
 * - At `contact` each of `b`'s palm sockets is within 15 mm of the object's
 *   surface (the issue's hand-meets-object bound), and stays within it until
 *   `held`.
 *
 * @param bodies The sweep bodies, each throwing to and catching from itself;
 *   `m-average` when absent.
 * @returns The cases.
 */
export function throwCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  // The ball caught: a handball's 0.11 m radius as its grip's aperture, the
  // contact `createBall` declares, lying at the thrower's feet.
  const handball: IAutoMovieMotionHumanProp = {
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
        frame: Transform.identity(),
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
    const styles: [IAutoMovieMotionHumanThrowObjectForm.Style, number][] = [
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
      const composition: IAutoMovieComposition = {
        type: "parallel",
        parts: [
          HumanChain.subject("a").act(
            "throwObject",
            { target: { kind: "point", at: target, frame: "world" }, style },
            "t1",
          ).node,
          HumanChain.subject("b").act("catchObject", {
            partner: "t1",
            ball: "ball",
          }).node,
        ],
      };
      const performance: IAutoMovieMotionHumanPerformance =
        FamilyCaseKit.perform(
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
      const launch: IAutoMovieMotionHumanThrowObjectLaunch.ILaunch =
        readThrowObjectLaunch(thrown.plan)!;
      const release: number = FamilyCaseKit.event(performance, "release", "a");
      const contact: number = FamilyCaseKit.event(performance, "contact", "b");
      const held: number = FamilyCaseKit.event(performance, "held", "b");

      // The displayed launch: the grip socket and its velocity at release.
      const grip = (seconds: number): IAutoMovieVector3 =>
        motionCaseSocket(who.body, performance, "a", seconds, "gripRight");
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
      const offer: IAutoMovieMotionHumanActionPlan.IOffer | undefined =
        caught.plan.offers;
      if (offer?.family !== "catchObject")
        throw new Error("The catch's plan offers no object path");
      const object = (seconds: number): IAutoMovieVector3 =>
        offer.object(seconds - caught.start);
      const palmGap = (seconds: number): number =>
        Math.max(
          ...(["palmLeft", "palmRight"] as const).map((name) =>
            Math.abs(
              Vector3.length(
                Vector3.subtract(
                  motionCaseSocket(who.body, performance, "b", seconds, name),
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
