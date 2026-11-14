import {
  createBicycle,
  createHorse,
  rideBicycle,
  rideHorse,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFrame,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanRide,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanProp,
  type seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A rider mounts a saddle and is carried by it: astride a bicycle that
 * leans through a turn and a horse that trots, the body stays on the
 * saddle, leans as the bicycle leans, and gets off when the ride is over.
 *
 * A rider does not slide on a saddle. So in the mount's own frame the
 * rider's seat and chest keep their places for the whole ride, whatever the
 * mount does in the world: a bicycle banks into a turn and its rider banks
 * with it, a horse's back rises and falls and its rider with it.
 *
 * Scenarios, the average man on the bicycle and the small woman on the
 * horse (one mount each, since reading a ride costs minutes), mounting from the
 * left while the mount stands, riding, then getting off with a plain
 * `rise`, which goes to the left of a saddle because the ride passes on the
 * seat it was entered on:
 * 1. A bicycle that goes 8 m straight and turns 90 degrees on an 8 m radius
 *    at 4 m/s, which banks it about 11 degrees (the steady-turn balance,
 *    atan of v squared over g r), and a horse that trots 14 m at 3.5 m/s
 *    (inside the trot's measured 2 to 6.5 m/s, Robilliard, Pfau and Wilson
 *    2007): mounting, riding the whole course and getting off plan.
 * 2. At nine instants of the ride the body's seat region lies within 10 mm of
 *    where it lay in the mount's frame when the ride began, and so does the
 *    sternum, 10 mm being the campaign's bound for a held contact.
 * 3. The mount does move under the rider: the bicycle banks at least 8
 *    degrees at some instant, and the horse's saddle rises and falls at
 *    least 20 mm (its trot's withers range is 92 mm, Rhodin et al. 2022).
 * 4. After getting off, both feet bear on the floor beside where the mount
 *    stopped.
 * 5. A wave performed over the ride plans: the ride yields the arms.
 * 6. Sitting on the horse from its right side is refused as a `base`
 *    refusal on `seat` that offers the left: the horse's saddle says it is
 *    mounted from the left.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Rides real archetypes, gives each to the performance as a moving prop and reads the rider's displayed seat region and sternum in the mount's frame through the ride; a rider left behind, upright on a banked bicycle or level on a bobbing horse fails.
 * @evidence contracts/development/testing.md#independent-expectations Where the mount is at each instant is the archetype ride's own placement; that a seated rider does not slide is what being carried means. The 10 mm is the campaign's support bound, the bank is the steady-turn balance and the trot's speed and bob are the cited measurements.
 * @evidence contracts/development/testing.md#distinguishing-cases A mount that banks and yaws and one that bobs, two bodies of opposite build, and a control that the mount really moved, without which a still rider on a still mount would pass; getting off, a wave over the ride, and the horse's seat from its wrong side.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and two archetype rides in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 6 scenarios with their bounds and sources.
 */
export function test_human_motion_ride_mounts(): void {
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
      legs: [{ kind: "straight", length: 14 }],
      cruise: 3.5,
      acceleration: 1.5,
      deceleration: 1.5,
    },
    "trot",
  );
  const mounts: readonly {
    name: string;
    model: HumanObject.IModel;
    duration: number;
    at: (seconds: number) => IAutoMovieTransform;
  }[] = [
    {
      name: "the bicycle",
      model: bicycle,
      duration: cycling.duration,
      at: (seconds: number): IAutoMovieTransform =>
        cycling.at(seconds).placement,
    },
    {
      name: "the horse",
      model: horse,
      duration: trotting.duration,
      at: (seconds: number): IAutoMovieTransform =>
        trotting.at(seconds).placement,
    },
  ];

  // Each body rides one mount, the pair crossed: a ride costs minutes to read, and each mount and each build is still covered.
  const names: readonly ["m-average", "f-small"] = ["m-average", "f-small"];
  for (let b: number = 0; b < names.length; ++b) {
    const name: "m-average" | "f-small" = names[b]!;
    const body: IHumanBody = motionHumanBody(name);
    for (const mount of [mounts[b]!]) {
      const label: string = `${name} on ${mount.name}`;

      // The mount stands for the first seconds, while the rider gets on.
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
      const seat: seated.ISeat = HumanObject.seat(mount.model, placed(0));
      const perform = (waving: boolean): HumanPerformance => {
        const riding: HumanChain = HumanChain.subject("a")
          .sit({ seat, seconds: 0.5 })
          .registered("ride", { on: "mount", seconds: WAIT + mount.duration });
        return new HumanPerformance({
          seed: "mounts",
          laws: [HumanRide.ride],
          props: [HumanObject.prop("mount", mount.model, placed(0), placed)],
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
          composition: (waving
            ? riding.over(
                (o: HumanChain): HumanChain => o.gesture({ kind: "wave" }),
              )
            : riding
          ).rise().node,
        });
      };

      // 5. The hands are free on the ride.
      try {
        perform(true);
      } catch (error) {
        complaints.push(
          `${label}, waving: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      let performance: HumanPerformance;
      try {
        performance = perform(false);
      } catch (error) {
        complaints.push(
          `${label}: ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
      const ride: HumanSegment.ISegment = performance.segments("a")[1]!;
      const off: HumanSegment.ISegment = performance.segments("a")[2]!;
      const reader: HumanSignature.IReader = HumanSignature.of(
        performance,
        "a",
        body,
        0,
      );

      // A region of the rider in the mount's own frame.
      const within = (
        region: AutoMovieHumanoidRegion,
        seconds: number,
      ): IAutoMovieVector3 => {
        const frame: IHumanProp.IFrame = placed(seconds);
        const world: IAutoMovieVector3 = HumanSignature.region(
          reader,
          region,
          seconds,
        );
        return Quaternion.rotateVector(Quaternion.inverse(frame.rotation), {
          x: world.x - frame.position.x,
          y: world.y - frame.position.y,
          z: world.z - frame.position.z,
        });
      };
      const from: number = ride.entryTime + 0.3;
      const to: number = ride.end - 0.05;
      let banked: number = 0;
      let low: number = Infinity;
      let high: number = -Infinity;
      for (const region of ["seat", "sternum"] as const) {
        const first: IAutoMovieVector3 = within(region, from);
        let worst: number = 0;
        let when: number = from;
        for (let k: number = 0; k <= 8; ++k) {
          const seconds: number = from + (k / 8) * (to - from);
          const now: IAutoMovieVector3 = within(region, seconds);
          const moved: number = Math.hypot(
            now.x - first.x,
            now.y - first.y,
            now.z - first.z,
          );
          if (moved > worst) {
            worst = moved;
            when = seconds;
          }
          const frame: IHumanProp.IFrame = placed(seconds);
          const up: IAutoMovieVector3 = Quaternion.rotateVector(
            frame.rotation,
            { x: 0, y: 1, z: 0 },
          );
          banked = Math.max(
            banked,
            (Math.acos(Math.max(-1, Math.min(1, up.y))) * 180) / Math.PI,
          );
          low = Math.min(low, frame.position.y);
          high = Math.max(high, frame.position.y);
        }
        if (worst > 0.01)
          complaints.push(
            `${label}: the ${region} moves ${(worst * 1000).toFixed(1)} mm in the mount's frame (at ${when.toFixed(2)} s), within 10 mm expected`,
          );
      }

      // 3. The mount moved under the rider.
      if (mount.name === "the bicycle" && banked < 8)
        complaints.push(
          `${label}: the bicycle banks ${banked.toFixed(1)} degrees at most, at least 8 expected in the turn`,
        );
      if (mount.name === "the horse" && high - low < 0.02)
        complaints.push(
          `${label}: the horse's back rises and falls ${((high - low) * 1000).toFixed(1)} mm, at least 20 mm expected at a trot`,
        );

      // 4. Off the mount, on the floor.
      for (const side of ["left", "right"] as const)
        if (!HumanSignature.bears(reader, off.end, side))
          complaints.push(
            `${label}: after getting off the ${side} foot does not bear on the floor`,
          );
    }
  }

  // 6. A horse is mounted from its left: from the right it is refused, offering the left.
  const stands: seated.ISeat = HumanObject.seat(horse, {
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
  });
  let thrown: unknown = null;
  try {
    new HumanPerformance({
      seed: "mounts",
      performers: [
        {
          subject: "a",
          body: motionHumanBody("m-average"),
          at: HumanFrame.point(
            { origin: { ...stands.at, y: 0 }, yaw: stands.yaw },
            { x: -0.6, y: 0, z: -0.2 },
          ),
          yaw: stands.yaw,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").sit({ seat: stands }).node,
    });
  } catch (error) {
    thrown = error;
  }
  if (
    !(
      thrown instanceof HumanRefusal &&
      thrown.kind === "base" &&
      thrown.axis === "seat" &&
      thrown.feasible !== undefined &&
      thrown.feasible !== null &&
      thrown.feasible.kind === "alternatives" &&
      thrown.feasible.values.includes("left")
    )
  )
    complaints.push(
      `mounting the horse from its right: expected a base refusal on seat offering left, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
    );
  TestValidator.equals("a rider is carried by the saddle", complaints, []);
}
