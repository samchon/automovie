import { AutoMovieEngineDefaultHumanoidRom, AutoMovieEngineQuaternion, AutoMovieEngineTransform, AutoMovieEngineVector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { IAutoMovieAffordance, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanProp, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanChain } from "../../chain/AutoMovieMotionHumanChain";
import { AutoMovieMotionHumanBody } from "../../body/AutoMovieMotionHumanBody";
import { handshake } from "../../handling/internal/handshake";
import { AutoMovieMotionHumanPerformance } from "../../perform/AutoMovieMotionHumanPerformance";
import type { IMotionCaptureCase } from "../internal/IMotionCaptureCase";
import { MotionBodies } from "../internal/MotionBodies";
import type { humanPolygonMan } from "../internal/humanPolygonMan";
import { HandOverlap } from "./HandOverlap";

/*
 * Capture cases of the handover law on the polygon man: the small woman hands a
 * bottle to the tall man, and an average man to another, standing at
 * `handshake.gap`. Read through `handlingCases`, whose documentation lists the
 * key frames, overlays and verdicts of `handling-handover-*`.
 * Returns: The cases.
 */
export function handoverCases(): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const [first, second] of [
    ["f-small", "m-tall"],
    ["m-average", "m-average"],
  ] as const) {
    const one: humanPolygonMan.IPolygonMan = MotionBodies.population(first);
    const two: humanPolygonMan.IPolygonMan = MotionBodies.population(second);
    const a: IAutoMovieMotionHumanBody = AutoMovieMotionHumanBody.create(
      one.body.skeleton,
      one.body.profile,
    );
    const b: IAutoMovieMotionHumanBody = AutoMovieMotionHumanBody.create(
      two.body.skeleton,
      two.body.profile,
    );
    const shoulder: IAutoMovieVector3 = a.rest.get("rightUpperArm")!;
    const grip = (
      id: string,
      y: number,
      toward: number,
    ): IAutoMovieAffordance => ({
      id,
      kind: "handle",
      frame: AutoMovieEngineTransform.of(
        { x: 0, y, z: 0 },
        AutoMovieEngineQuaternion.normalize(
          AutoMovieEngineQuaternion.multiply(
            AutoMovieEngineQuaternion.fromAxisAngle(
              { x: 0, y: 1, z: 0 },
              toward > 0 ? 180 : 0,
            ),
            AutoMovieEngineQuaternion.normalize(
              AutoMovieEngineQuaternion.multiply(
                AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
                AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
              ),
            ),
          ),
        ),
      ),
      extent: null,
      grip: "power",
      aperture: 0.07,
    });
    const bottle: IAutoMovieMotionHumanProp = {
      subject: "bottle",
      frame: {
        position: { x: shoulder.x, y: a.measure.hipHeight, z: 0.3 },
        rotation: AutoMovieEngineQuaternion.identity(),
      },
      points: {},
      shapes: [
        {
          id: "glass",
          material: "glass",
          transform: {
            position: { x: 0, y: 0.095, z: 0 },
            rotation: AutoMovieEngineQuaternion.identity(),
          },
          kind: "capsule",
          radius: 0.035,
          halfLength: 0.06,
        },
      ],
      affordances: [grip("low", 0.06, -1), grip("high", 0.15, 1)],
    };
    const D: number =
      handshake.gap(a, b) +
      handshake.stance(a).sternum +
      handshake.stance(b).sternum;
    const performance: IAutoMovieMotionHumanPerformance = new AutoMovieMotionHumanPerformance({
      seed: `handling-handover-${first}-${second}`,
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
      props: [bottle],
      composition: AutoMovieMotionHumanChain.pair(
        AutoMovieMotionHumanChain.subject("a")
          .stand({ hold: 0.3 })
          .pickUp({ prop: "bottle", handle: "low", hand: "right" }),
        AutoMovieMotionHumanChain.subject("b").stand({ hold: 0.3 }),
      ).handOver({
        prop: "bottle",
        handle: "high",
        hand: "right",
        receiverHand: "right",
        mass: 0.5,
      }).node,
    });
    const giving = performance
      .segments("a")
      .find((s) => s.name === "handOver")!;
    const taking = performance.segments("b").find((s) => s.name === "receive")!;
    const event = (s: typeof giving, n: string): number =>
      s.start +
      s.plan.events.find((e) => e.name === n)!.share * s.plan.duration;
    const closed: number = event(taking, "gripClosed");
    const release: number = event(giving, "release");
    const centre = (t: number): IAutoMovieVector3 => {
      const f = performance.prop("bottle", t);
      return AutoMovieEngineVector3.add(
        f.position,
        AutoMovieEngineQuaternion.rotateVector(f.rotation, { x: 0, y: 0.095, z: 0 }),
      );
    };
    const sternum = (
      subject: string,
      body: IAutoMovieMotionHumanBody,
      t: number,
    ): IAutoMovieVector3 =>
      AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
        body.surfaces.regions.sternum,
        performance.bones(subject, t).get(body.surfaces.regions.sternum.bone)!,
      ).point;
    const middle: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
      AutoMovieEngineVector3.add(sternum("a", a, closed), sternum("b", b, closed)),
      0.5,
    );
    const exchange: number = AutoMovieEngineVector3.distance(centre(closed), middle);
    let jump: number = 0;
    let previous: IAutoMovieVector3 = performance.prop("bottle", 0).position;
    for (let t: number = 1 / 240; t <= performance.duration; t += 1 / 240) {
      const now: IAutoMovieVector3 = performance.prop("bottle", t).position;
      jump = Math.max(jump, AutoMovieEngineVector3.distance(now, previous));
      previous = now;
    }
    const offset = (t: number): IAutoMovieVector3 => {
      const hand: IAutoMovieResolvedBone = performance
        .bones("b", t)
        .get("rightHand")!;
      return AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.inverse(hand.worldRotation),
        AutoMovieEngineVector3.subtract(
          performance.prop("bottle", t).position,
          hand.worldPosition,
        ),
      );
    };
    let held: number = 0;
    for (let t: number = release; t <= performance.duration; t += 1 / 24)
      held = Math.max(held, AutoMovieEngineVector3.distance(offset(t), offset(release)));
    let deepest: number = Infinity;
    for (let t: number = closed; t <= release; t += 1 / 48)
      deepest = Math.min(
        deepest,
        HandOverlap.deepest(
          a,
          performance.bones("a", t),
          b,
          performance.bones("b", t),
        ),
      );
    let overshoot: number = 0;
    let slip: number = 0;
    for (const subject of ["a", "b"]) {
      for (const foot of ["leftFoot", "rightFoot"] as const) {
        const from: IAutoMovieVector3 = performance
          .bones(subject, giving.entryTime)
          .get(foot)!.worldPosition;
        for (
          let t: number = giving.entryTime;
          t <= performance.duration;
          t += 1 / 24
        )
          slip = Math.max(
            slip,
            AutoMovieEngineVector3.distance(
              performance.bones(subject, t).get(foot)!.worldPosition,
              from,
            ),
          );
      }
      for (let t: number = 0; t <= performance.duration; t += 1 / 24)
        for (const j of performance.pose(subject, t).joints) {
          const c = AutoMovieEngineDefaultHumanoidRom[j.bone];
          if (c !== undefined)
            overshoot = Math.max(overshoot, AutoMovieEngineKinematics.jointRomOvershoot(j, c));
        }
    }
    const path: IAutoMovieVector3[] = [];
    for (let t: number = 0; t <= performance.duration; t += 1 / 48)
      path.push(centre(t));
    out.push({
      name: `handling-handover-${first}-${second}`,
      times: [
        { seconds: giving.entryTime, label: "offer starts" },
        { seconds: event(giving, "offered"), label: "offered" },
        { seconds: closed, label: "gripClosed" },
        { seconds: (closed + release) / 2, label: "both hold" },
        { seconds: release, label: "release" },
        { seconds: performance.duration, label: "taken" },
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
      trails: [{ color: 0x4a8a5a, points: path }],
      targets: [{ at: middle, radius: 0.02, color: 0x40a040 }],
      verdicts: [
        {
          name: "the giver lets go only after the receiver's grip closes",
          passed: release >= closed,
          detail: `release ${release.toFixed(3)} s, gripClosed ${closed.toFixed(3)} s`,
        },
        {
          name: "the exchange within 0.15 m of the chests' midpoint",
          passed: exchange <= 0.15,
          detail: `${exchange.toFixed(3)} m`,
        },
        {
          name: "the bottle never jumps (under 5 mm per 1/240 s)",
          passed: jump < 0.005,
          detail: `${(jump * 1000).toFixed(2)} mm`,
        },
        {
          name: "the receiver holds the bottle within 1 mm after the release",
          passed: held <= 0.001,
          detail: `${(held * 1000).toFixed(2)} mm`,
        },
        {
          name: "no hand or forearm capsule enters the other's by more than 10 mm",
          passed: deepest >= -0.01,
          detail: `${(deepest * 1000).toFixed(1)} mm`,
        },
        {
          name: "ankles move at most 5 mm",
          passed: slip <= 0.005,
          detail: `${(slip * 1000).toFixed(2)} mm`,
        },
        {
          name: "every joint inside the default range of motion",
          passed: overshoot <= 1e-6,
          detail: `${overshoot.toFixed(4)} deg`,
        },
      ],
    });
  }
  return out;
}
