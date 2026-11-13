import {
  createBicycle,
  createHorse,
  rideBicycle,
  rideHorse,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFrame,
  HumanObject,
  HumanPerformance,
  HumanRide,
  HumanSignature,
  type IHumanBody,
  type IHumanProp,
  type seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A rider's hands stay on what they hold while the mount moves under
 * them: a cyclist's on the handlebar grips through a turn, a horseman's on
 * the reins at a trot.
 *
 * The ride yields the arms, so holding on is an arm action over the ride,
 * a `touch` of kind `hold` aimed at the mount's own points. Those points
 * move within the mount, the bar with the steering and the reins with the
 * horse's neck, and a hand that holds one goes with it.
 *
 * Scenarios, each after 6 s in which the mount stands while the rider gets
 * on and takes hold, read at seven instants spread from 30 to 90 % of the
 * mount's course:
 * 1. The average man on a bicycle that goes 8 m straight and turns 90
 *    degrees on an 8 m radius at 4 m/s, a hand on each grip.
 * 2. The small woman on a horse that trots 10 m at 3.5 m/s, a hand on each
 *    rein.
 * At every instant each wrist is within 0.7 of the hand's length of its
 * grip or rein where that is then (the palm's middle lies about half a
 * hand from the wrist; the share is provisional), and against that point,
 * in the mount's own axes, it has moved at most 10 mm from where it was at
 * the first instant (the campaign's bound for a held contact). A
 * motorcycle's grips are the bicycle's case with another model.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Rides real archetypes and reads the displayed wrists against the mounts' own moving contacts; hands left where the grips stood at rest, hands that drift off them, or a hold that cannot be taken over a ride fails.
 * @evidence contracts/development/testing.md#independent-expectations Where a grip or a rein is comes from the archetype's own ride and the 10 mm is the campaign's bound; neither is read from the ride or the touch law. Limitation: the fingers' closure on the grip is the hand tests' to judge.
 * @evidence contracts/development/testing.md#distinguishing-cases A grip that turns with a steered bar and a rein that rides a trotting horse, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds two rides in memory, reading seven instants of each: one body a mount, since the claim is the relation between a hand and the part it holds, and seven instants cover the straight, the turn and the stride.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 2 scenarios with their bounds.
 */
export function test_human_motion_ride_grips(): void {
  const complaints: string[] = [];
  const WAIT: number = 6;
  const bicycle: ReturnType<typeof createBicycle> = createBicycle({});
  const horse: ReturnType<typeof createHorse> = createHorse({});
  const cycling: ReturnType<typeof rideBicycle> = rideBicycle(bicycle, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: 8 },
      { kind: "turn", radius: 8, angle: 90 },
    ],
    cruise: 4,
    acceleration: 1.5,
    deceleration: 2,
  });
  const trotting: ReturnType<typeof rideHorse> = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      legs: [{ kind: "straight", length: 10 }],
      cruise: 3.5,
      acceleration: 1.5,
      deceleration: 1.5,
    },
    "trot",
  );
  const rides: readonly {
    label: string;
    name: "m-average" | "f-small";
    model: HumanObject.IModel;
    duration: number;
    at: (seconds: number) => IAutoMovieTransform;
    part: (id: string, seconds: number) => IAutoMovieTransform;
    holds: Record<"left" | "right", string>;
    ride: Pick<HumanRide.IParams, "feet" | "seat">;
  }[] = [
    {
      label: "the bicycle's grips",
      name: "m-average",
      model: bicycle,
      duration: cycling.duration,
      at: (seconds: number): IAutoMovieTransform =>
        cycling.at(seconds).placement,
      part: (id: string, seconds: number): IAutoMovieTransform =>
        cycling.frame(id as Parameters<typeof cycling.frame>[0], seconds),
      holds: { left: "leftGrip", right: "rightGrip" },
      ride: { feet: { left: "leftPedal", right: "rightPedal" } },
    },
    {
      label: "the horse's reins",
      name: "f-small",
      model: horse,
      duration: trotting.duration,
      at: (seconds: number): IAutoMovieTransform =>
        trotting.at(seconds).placement,
      part: (id: string, seconds: number): IAutoMovieTransform =>
        trotting.frame(id as Parameters<typeof trotting.frame>[0], seconds),
      holds: { left: "leftRein", right: "rightRein" },
      ride: {
        seat: "seat",
        feet: { left: "leftStirrup", right: "rightStirrup" },
      },
    },
  ];
  for (const mount of rides) {
    const body: IHumanBody = motionHumanBody(mount.name);
    const known: Map<number, IHumanProp.IFrame> = new Map();
    const placed = (seconds: number): IHumanProp.IFrame => {
      const kept: IHumanProp.IFrame | undefined = known.get(seconds);
      if (kept !== undefined) return kept;
      const placement: IAutoMovieTransform = mount.at(
        Math.max(0, seconds - WAIT),
      );
      const frame: IHumanProp.IFrame = {
        position: placement.translation,
        rotation: placement.rotation,
      };
      known.set(seconds, frame);
      return frame;
    };
    const part = (id: string, seconds: number): IAutoMovieTransform =>
      mount.part(id, Math.max(0, seconds - WAIT));
    const seat: seated.ISeat = HumanObject.seat(mount.model, placed(0));
    const seconds: number = WAIT + mount.duration;
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "grips",
        laws: [HumanRide.ride],
        props: [HumanObject.prop("mount", mount.model, placed(0), placed, part)],
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
          .registered("ride", { on: "mount", seconds, ...mount.ride })
          .over(
            (o: HumanChain): HumanChain =>
              o.touch({
                kind: "hold",
                side: "left",
                target: {
                  kind: "prop",
                  subject: "mount",
                  point: mount.holds.left,
                },
                other: {
                  kind: "prop",
                  subject: "mount",
                  point: mount.holds.right,
                },
                count: 1,
                hold: seconds - 3,
              }),
          ).node,
      });
    } catch (error) {
      complaints.push(
        `${mount.label}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );

    // A wrist from the point it holds where that is then, in the mount's own axes.
    const held = (side: "left" | "right", t: number): IAutoMovieVector3 => {
      const wrist: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        t,
        `${side}Hand`,
      );
      const at: IAutoMovieVector3 = part(mount.holds[side], t).translation;
      return Quaternion.rotateVector(Quaternion.inverse(placed(t).rotation), {
        x: wrist.x - at.x,
        y: wrist.y - at.y,
        z: wrist.z - at.z,
      });
    };
    for (const side of ["left", "right"] as const) {
      let first: IAutoMovieVector3 | null = null;
      let far: number = 0;
      let drift: number = 0;
      for (let k: number = 0; k <= 6; ++k) {
        const t: number = WAIT + (0.3 + 0.1 * k) * mount.duration;
        const now: IAutoMovieVector3 = held(side, t);
        first ??= now;
        far = Math.max(far, Math.hypot(now.x, now.y, now.z));
        drift = Math.max(
          drift,
          Math.hypot(now.x - first.x, now.y - first.y, now.z - first.z),
        );
      }
      if (far > 0.7 * body.measure.hand || drift > 0.01)
        complaints.push(
          `${mount.label}: the ${side} wrist is up to ${(far * 1000).toFixed(1)} mm from what it holds and moves ${(drift * 1000).toFixed(1)} mm against it; within ${(700 * body.measure.hand).toFixed(1)} mm and 10 mm expected`,
        );
    }
  }
  TestValidator.equals("a rider's hands stay on what they hold", complaints, []);
}
