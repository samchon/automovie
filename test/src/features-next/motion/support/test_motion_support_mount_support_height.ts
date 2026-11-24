import {
  createBicycle,
  createHorse,
  createMotorcycle,
  createSeat,
} from "@automovie/archetypes";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot, HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Mounting from the front or side uses the actual seat and available footrests.
 *
 * Scenarios:
 * - A chair, bar stool and scooter face forward. Bicycle, motorcycle and horse saddles admit an astride posture.
 * - With and without footrests, each approach matches seat height, planted ball placement, free clearance and standing exit.
 * - Commit, seat contact, pre-seat-off and standing distinguish four admissible changes of support. A mid-mount stand or walk is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads actual joint positions and declared contact windows at seated hold, plant and standing phases.
 * @evidence contracts/development/testing.md#independent-expectations The placed object's seat and tread coordinates establish target heights. The campaign bounds are 10 mm seat error, 15 mm rest error, 5 mm slip and 20 mm standing hip error or free sole clearance.
 * @evidence contracts/development/testing.md#distinguishing-cases Front and lateral entry plus present or absent rests change the reachable support. Classification needs only the real model, without a performed mount.
 * @evidence contracts/development/testing.md#execution-ownership Runs the two different entry branches and their cut phases. Each shoe is read from the same phase.
 * @evidence contracts/development/common.md#meaningful-documentation States each contact and interruption obligation.
 */
export function test_motion_support_mount_support_height(): void {
  const complaints: string[] = [];
  const where: IAutoMovieMotionHumanObject.Placement = {
    at: { x: 0, y: 0, z: -0.6 },
    yaw: 0,
  };
  const stool = HumanObject.seat(createSeat({ kind: "barStool" }), where);
  const saddle = HumanObject.seat(createHorse({}), where);
  const chair = HumanObject.seat(createSeat({ kind: "dining" }), where);
  const scooter = HumanObject.seat(
    createMotorcycle({ kind: "scooter" }),
    where,
  );
  const bicycle = HumanObject.seat(createBicycle({}), where);
  const motorcycle = HumanObject.seat(
    createMotorcycle({ kind: "motorcycle" }),
    where,
  );
  for (const seat of [chair, stool, scooter])
    if (seat.astride === true)
      complaints.push("A forward seat is classified astride.");
  for (const seat of [saddle, bicycle, motorcycle])
    if (seat.astride !== true)
      complaints.push("A saddle is classified as a forward seat.");
  checkMount(complaints, chair, motionHumanBody("f-small"), false);
  checkMount(complaints, scooter, motionHumanBody("m-average"), false);
  checkMount(complaints, stool, motionHumanBody("m-average"), true);
  checkMount(complaints, saddle, motionHumanBody("f-small"), true);
  TestValidator.equals("mount support and interrupted entry", complaints, []);
}

type SaddleEnd = "standing" | "seated";

function checkMount(
  complaints: string[],
  seat: IAutoMovieMotionHumanSeated.ISeat,
  body: IAutoMovieMotionHumanBody,
  checkInterruptions: boolean,
): void {
  const beside = (x: number, z: number): IAutoMovieVector3 =>
    HumanFrame.point(
      { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
      { x, y: 0, z },
    );
  const perform = (
    target: IAutoMovieMotionHumanSeated.ISeat,
    then: (chain: IAutoMovieMotionHumanChain) => IAutoMovieMotionHumanChain,
    seconds: number = 0.5,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "saddle",
      performers: [
        {
          subject: "a",
          body,
          at: target.astride ? beside(0.6, -0.2) : beside(0, 0.2),
          yaw: seat.yaw,
          proficiency: { level: "trained" },
        },
      ],
      composition: then(
        HumanChain.subject("a").sit({ seat: target, hold: seconds }),
      ).node,
    });
  const { footrests: _rests, ...bare } = seat;
  const targets: readonly IAutoMovieMotionHumanSeated.ISeat[] =
    checkInterruptions ? [seat, bare] : [seat];
  for (const target of targets) {
    const label: string =
      target === seat ? "seat with rests" : "seat without rests";
    let performance: IAutoMovieMotionHumanPerformance;
    try {
      performance = perform(target, (chain) => chain.rise(), 1);
    } catch (error) {
      complaints.push(`${label}: ${String(error)}`);
      continue;
    }
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      seat.yaw,
    );
    const [sitting, rising] = performance.segments("a");
    if (sitting === undefined || rising === undefined) {
      complaints.push(
        `${label}: the sitting or the getting off was not placed`,
      );
      continue;
    }
    const ball = (side: AutoMovieHumanSide, t: number): IAutoMovieVector3 =>
      HumanFoot.sockets(body, HumanSignature.bones(reader, t), side).find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === "ball",
      )!.point;

    // 2. The seat region rests at the saddle's height.
    const seatedAt: number = sitting.end - 0.05;
    const rests: number = HumanSignature.region(reader, "seat", seatedAt).y;
    if (Math.abs(rests - seat.at.y) > 0.01)
      complaints.push(
        `${label}: the seat region rests at ${rests.toFixed(3)} m, within 10 mm of the saddle's ${seat.at.y.toFixed(3)} m expected`,
      );

    // 3. Off the floor: on a rest, or hanging clear.
    for (const side of ["left", "right"] as const) {
      const planted: boolean = sitting.plan.contacts.some(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.part === `${side}Foot` && c.kind === "plant" && c.to >= 1 - 1e-9,
      );
      const tread: IAutoMovieVector3 | undefined = target.footrests?.[side];
      const high =
        target.at.y >
        1.2 *
          (body.measure.ankleHeight +
            body.measure.shank -
            body.measure.thighRadius);
      if (planted && tread !== undefined && high) {
        const at: IAutoMovieVector3 = ball(side, seatedAt);
        const off: number = Math.hypot(
          at.x - tread.x,
          at.y - tread.y,
          at.z - tread.z,
        );
        if (off > 0.015)
          complaints.push(
            `${label}: the ${side} foot's ball rests ${(off * 1000).toFixed(1)} mm from its rest, within 15 mm expected`,
          );
      } else if (high && !planted) {
        const sole: number = HumanSignature.sole(reader, seatedAt, side).y;
        if (sole < 0.02)
          complaints.push(
            `${label}: the hanging ${side} sole is at ${(sole * 1000).toFixed(1)} mm, at least 20 mm clear of the floor expected`,
          );
      }
    }

    // 4. No declared plant slips.
    for (const segment of [sitting, rising])
      for (const c of segment.plan.contacts) {
        if (c.kind !== "plant" || !c.part.endsWith("Foot")) continue;
        const side: AutoMovieHumanSide =
          c.part === "leftFoot" ? "left" : "right";
        const from: number = Math.max(
          segment.entryTime,
          segment.start + c.from * segment.plan.duration,
        );
        const to: number = Math.min(
          segment.end,
          segment.start + c.to * segment.plan.duration,
        );
        if (to - from < 0.1) continue;
        const first: IAutoMovieVector3 = ball(side, from + 0.02);
        let slip: number = 0;
        for (const t of HumanSignature.times(
          from + 0.02,
          to - 0.02,
          3 / (to - from - 0.04),
        )) {
          const now: IAutoMovieVector3 = ball(side, t);
          slip = Math.max(
            slip,
            Math.hypot(now.x - first.x, now.y - first.y, now.z - first.z),
          );
        }
        if (slip > 0.005)
          complaints.push(
            `${label}: the ${side} foot's ball moves ${(slip * 1000).toFixed(1)} mm while planted from ${from.toFixed(2)} to ${to.toFixed(2)} s of ${segment.name}, within 5 mm expected`,
          );
      }

    // 5. Got off, the body stands as it stood.
    const end: number = rising.end;
    const hips = (t: number): number =>
      (HumanSignature.joint(reader, t, "leftUpperLeg").y +
        HumanSignature.joint(reader, t, "rightUpperLeg").y) /
      2;
    for (const side of ["left", "right"] as const) {
      if (!HumanSignature.bears(reader, end, side))
        complaints.push(
          `${label}: after getting off the ${side} foot does not bear on the floor`,
        );
      const knee: number = HumanSignature.knee(reader, end, side);
      if (knee > 15)
        complaints.push(
          `${label}: after getting off the ${side} knee is flexed ${knee.toFixed(1)} degrees, within 15 of straight expected`,
        );
    }
    if (Math.abs(hips(end) - hips(0)) > 0.02)
      complaints.push(
        `${label}: after getting off the hips stand at ${hips(end).toFixed(3)} m, within 20 mm of the quiet stance's ${hips(0).toFixed(3)} m expected`,
      );
  }
  if (!checkInterruptions) return;
  const check = (
    what: string,
    then: (chain: IAutoMovieMotionHumanChain) => IAutoMovieMotionHumanChain,
    ends: SaddleEnd,
  ): void => {
    let performance: IAutoMovieMotionHumanPerformance;
    try {
      performance = perform(seat, then);
    } catch (error) {
      complaints.push(
        `${what}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      seat.yaw,
    );
    const segments: readonly IAutoMovieMotionHumanSegment[] =
      performance.segments("a");
    const end: number = segments[segments.length - 1]!.end;
    const hips = (t: number): number =>
      (HumanSignature.joint(reader, t, "leftUpperLeg").y +
        HumanSignature.joint(reader, t, "rightUpperLeg").y) /
      2;
    if (ends === "seated") {
      const rests: number = HumanSignature.region(reader, "seat", end).y;
      if (Math.abs(rests - seat.at.y) > 0.01)
        complaints.push(
          `${what}: the seat region ends at ${rests.toFixed(3)} m, within 10 mm of the saddle's ${seat.at.y.toFixed(3)} m expected`,
        );
      return;
    }
    for (const side of ["left", "right"] as const)
      if (!HumanSignature.bears(reader, end, side))
        complaints.push(
          `${what}: the ${side} foot does not bear on the floor at the end`,
        );
    if (Math.abs(hips(end) - hips(0)) > 0.02)
      complaints.push(
        `${what}: the hips end at ${hips(end).toFixed(3)} m, within 20 mm of the quiet stance's ${hips(0).toFixed(3)} m expected`,
      );
  };

  // 1. Thinking better of it, while the feet are still on the floor.
  check(
    "sit cut by stand at commit",
    (chain: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
      chain.until({ event: "commit" }).stand({ hold: 1 }),
    "standing",
  );

  // 2. Half on, off again.
  check(
    "sit cut by rise at seatContact",
    (chain: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
      chain
        .until({ event: "seatContact" })
        .rise(seat.astride ? { to: "left" } : {}),
    "standing",
  );

  // 3. Settling back.
  check(
    "rise cut by sit at 0.05",
    (chain: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
      chain
        .rise(seat.astride ? { to: "left" } : {})
        .until({ share: 0.05 })
        .sit({ seat, hold: 0.5 }),
    "seated",
  );

  // 4. Off and away, to the side the body got off on.
  check(
    "rise cut by walk at standing",
    (chain: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
      chain
        .rise(seat.astride ? { to: "left" } : {})
        .until({ event: "standing" })
        .walk({ to: seat.astride ? beside(1, 2) : beside(0, 2.6) }),
    "standing",
  );

  // 5. Cuts sit does not declare: a walk, and a stand once a foot is off the floor.
  const forbidden: readonly (readonly [
    string,
    (chain: IAutoMovieMotionHumanChain) => IAutoMovieMotionHumanChain,
  ])[] = [
    [
      "sit cut by walk at 0.5",
      (chain: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
        chain
          .until({ share: 0.5 })
          .walk({ to: { x: 0, y: 0, z: seat.at.z + 3 } }),
    ],
    [
      "sit cut by stand at 0.5",
      (chain: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
        chain.until({ share: 0.5 }).stand({ hold: 1 }),
    ],
  ];
  for (const [what, then] of forbidden) {
    let thrown: unknown = null;
    try {
      perform(seat, then);
    } catch (error) {
      thrown = error;
    }
    if (!(thrown instanceof HumanRefusal))
      complaints.push(
        `${what}: expected a refusal, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );
  }
}
