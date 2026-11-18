import { createBicycle, createHorse, rideBicycle } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFoot,
  HumanFrame,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanRide,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A cyclist's feet go round with the pedals: each foot stays on its pedal
 * while the crank turns it, the seat stays on the saddle, and a foot told
 * to stay on a point the bicycle does not have is refused.
 *
 * Scenarios:
 * A rider mounts and dismounts a saddle with and without stirrups. Contact,
 * planted slip, free sole clearance and the landing are measured in world space.
 * Cuts at commit, seat contact and standing use the support available at the cut.
 * the average man on a bicycle that goes 10 m straight at 4 m/s
 * after standing 6 s while he mounts, the ride given the pedals as the
 * points the feet stay on:
 * 1. Mounting and the ride plan.
 * 2. Over one turn of the crank, from one top dead centre of the left arm
 *    to the next as the bicycle's own ride publishes them, read at nine
 *    instants, the ball of each foot stays within 10 mm of where it rested
 *    against its pedal where the pedal is then, in the bicycle's own axes
 *    (the campaign's bound for a held contact).
 * 3. Over that turn the left ankle's height above the bicycle's root varies
 *    by at least 0.25 m: a pedal travels a circle of twice the crank's
 *    length, 0.33 to 0.35 m for the 165 to 175 mm cranks road bicycles
 *    carry, and the floor leaves room for nine instants missing its top and
 *    bottom (provisional).
 * 4. At those instants the seat region stays within 10 mm of where it sat
 *    in the bicycle's own frame.
 * 5. A ride whose left foot is to stay on `leftStirrup` is refused as an
 *    `affordance` refusal on `feet` that lists the bicycle's points.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Rides a real bicycle archetype whose crank turns with the distance and reads the displayed feet against the pedals and the seat against the frame; feet left where the pedals stood at rest, a seat pulled off the saddle by the legs, or an unknown point accepted fails.
 * @evidence contracts/development/testing.md#independent-expectations Where a pedal is comes from the archetype's own ride, the 10 mm is the campaign's bound and the circle is the crank's geometry; none is read from the ride law. Limitation: the foot's pitch on the pedal (ankling) and the knees' track are not read.
 * @evidence contracts/development/testing.md#distinguishing-cases The feet that must move with the pedals against the seat that must not, and a point the bicycle has against one it lacks.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and one archetype ride in memory and reads nine instants of one crank turn, an eighth of it apart, which shows the whole circle: one body, since the claim is the relation between the feet and the pedals of whoever rides.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 5 scenarios with their bounds and sources.
 */
export function test_motion_posture_rider_reach(): void {
  const complaints: string[] = [];
  checkSaddle(complaints);
  const WAIT: number = 6;
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const bicycle: ReturnType<typeof createBicycle> = createBicycle({});
  const cycling: ReturnType<typeof rideBicycle> = rideBicycle(bicycle, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 10 }],
    cruise: 4,
    acceleration: 1.5,
    deceleration: 2,
  });
  const known: Map<number, IAutoMovieRigidTransform> = new Map();
  const placed = (seconds: number): IAutoMovieRigidTransform => {
    const kept: IAutoMovieRigidTransform | undefined = known.get(seconds);
    if (kept !== undefined) return kept;
    const placement: IAutoMovieTransform = cycling.at(
      Math.max(0, seconds - WAIT),
    ).placement;
    const frame: IAutoMovieRigidTransform = {
      position: placement.translation,
      rotation: placement.rotation,
    };
    known.set(seconds, frame);
    return frame;
  };

  // Where one of the bicycle's contacts is in the world at a film second: the pedals turn on the crank.
  const part = (id: string, seconds: number): IAutoMovieTransform =>
    cycling.frame(
      id as Parameters<typeof cycling.frame>[0],
      Math.max(0, seconds - WAIT),
    );
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    bicycle,
    placed(0),
  );
  const perform = (left: string): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "pedals",
      laws: [HumanRide.ride],
      props: [HumanObject.prop("bicycle", bicycle, placed(0), placed, part)],
      performers: [
        {
          subject: "a",
          body,
          at: HumanFrame.point(
            { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
            { x: 0.6, y: 0, z: -0.2 },
          ),
          yaw: seat.yaw,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .sit({ seat, seconds: 0.5 })
        .registered("ride", {
          on: "bicycle",
          seconds: WAIT + cycling.duration,
          feet: { left, right: "rightPedal" },
        }).node,
    });

  // 5. A point the bicycle does not have.
  let thrown: unknown = null;
  try {
    perform("leftStirrup");
  } catch (error) {
    thrown = error;
  }
  if (
    !(
      thrown instanceof HumanRefusal &&
      thrown.kind === "affordance" &&
      thrown.axis === "feet" &&
      thrown.feasible?.kind === "alternatives" &&
      thrown.feasible.values.includes("leftPedal")
    )
  )
    complaints.push(
      `a foot on a stirrup of a bicycle: expected an affordance refusal on feet listing the bicycle's points, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
    );

  // 1 to 4. The feet go round; the seat stays.
  let performance: IAutoMovieMotionHumanPerformance | null = null;
  try {
    performance = perform("leftPedal");
  } catch (error) {
    complaints.push(
      `pedalling: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (performance !== null) {
    const ride: IAutoMovieMotionHumanSegment = performance.segments("a")[1]!;
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );

    // A world point from a place of the bicycle, in the bicycle's own axes.
    const local = (
      world: IAutoMovieVector3,
      from: IAutoMovieVector3,
      seconds: number,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(Quaternion.inverse(placed(seconds).rotation), {
        x: world.x - from.x,
        y: world.y - from.y,
        z: world.z - from.z,
      });
    const ball = (side: AutoMovieHumanSide, t: number): IAutoMovieVector3 =>
      local(
        HumanFoot.sockets(body, HumanSignature.bones(reader, t), side).find(
          (s: IAutoMovieMotionHumanFoot.ISocket): boolean =>
            s.socket === "ball",
        )!.point,
        part(`${side}Pedal`, t).translation,
        t,
      );
    const tops: number[] = cycling.instants
      .filter((i): boolean => i.label === "leftTopDeadCentre")
      .map((i): number => WAIT + i.seconds)
      .filter(
        (s: number): boolean =>
          s >= ride.entryTime + 0.3 && s <= ride.end - 0.3,
      );
    const from: number | undefined = tops[(tops.length - 1) >> 1];
    const to: number | undefined = tops[((tops.length - 1) >> 1) + 1];
    if (from === undefined || to === undefined)
      complaints.push(
        `pedalling: the ride holds ${tops.length} top dead centres of the left crank arm, a whole turn between two expected`,
      );
    else {
      const sat: IAutoMovieVector3 = local(
        HumanSignature.region(reader, "seat", from),
        placed(from).position,
        from,
      );
      const stood: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
        left: ball("left", from),
        right: ball("right", from),
      };
      let lowest: number = Infinity;
      let highest: number = -Infinity;
      for (let k: number = 0; k <= 8; ++k) {
        const t: number = from + (k / 8) * (to - from);
        const seatNow: IAutoMovieVector3 = local(
          HumanSignature.region(reader, "seat", t),
          placed(t).position,
          t,
        );
        const slid: number = Math.hypot(
          seatNow.x - sat.x,
          seatNow.y - sat.y,
          seatNow.z - sat.z,
        );
        if (slid > 0.01)
          complaints.push(
            `pedalling: the seat is ${(slid * 1000).toFixed(1)} mm from where it sat at ${t.toFixed(2)} s, within 10 mm expected`,
          );
        for (const side of ["left", "right"] as const) {
          const now: IAutoMovieVector3 = ball(side, t);
          const moved: number = Math.hypot(
            now.x - stood[side].x,
            now.y - stood[side].y,
            now.z - stood[side].z,
          );
          if (moved > 0.01)
            complaints.push(
              `pedalling: the ${side} foot's ball is ${(moved * 1000).toFixed(1)} mm from its place on the pedal at ${t.toFixed(2)} s, within 10 mm expected`,
            );
        }
        const ankle: number = local(
          HumanSignature.joint(reader, t, "leftFoot"),
          placed(t).position,
          t,
        ).y;
        lowest = Math.min(lowest, ankle);
        highest = Math.max(highest, ankle);
      }
      if (highest - lowest < 0.25)
        complaints.push(
          `pedalling: the left ankle's height varies ${(highest - lowest).toFixed(3)} m over a turn of the crank, at least 0.250 m expected`,
        );
    }
  }
  TestValidator.equals("a cyclist's feet go round", complaints, []);
}

type SaddleEnd = "standing" | "seated";

function checkSaddle(complaints: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    createHorse({}),
    {
      at: { x: 0, y: 0, z: -0.6 },
      yaw: 0,
    },
  );
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
          at: beside(0.6, -0.2),
          yaw: seat.yaw,
          proficiency: { level: "trained" },
        },
      ],
      composition: then(HumanChain.subject("a").sit({ seat: target, seconds }))
        .node,
    });
  const { footrests: _rests, ...bare } = seat;
  const targets: readonly IAutoMovieMotionHumanSeated.ISeat[] = [seat, bare];
  for (const target of targets) {
    const label: string =
      target === seat ? "saddle with stirrups" : "bare saddle";
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
      if (planted && tread !== undefined) {
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
      } else if (!planted && tread === undefined) {
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
      chain.until({ event: "commit" }).stand({ seconds: 1 }),
    "standing",
  );

  // 2. Half on, off again.
  check(
    "sit cut by rise at seatContact",
    (chain: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
      chain.until({ event: "seatContact" }).rise({ to: "left" }),
    "standing",
  );

  // 3. Settling back.
  check(
    "rise cut by sit at 0.05",
    (chain: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
      chain
        .rise({ to: "left" })
        .until({ share: 0.05 })
        .sit({ seat, seconds: 0.5 }),
    "seated",
  );

  // 4. Off and away, to the side the body got off on.
  check(
    "rise cut by walk at standing",
    (chain: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
      chain
        .rise({ to: "left" })
        .until({ event: "standing" })
        .walk({ to: beside(1, 2) }),
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
        chain.until({ share: 0.5 }).stand({ seconds: 1 }),
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
