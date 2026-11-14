import {
  createExerciseBike,
  createExerciseMat,
  createRowingMachine,
  createSled,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  HumanSportCarry,
  HumanSportWorkout,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The gym machines serve the workouts that bear on them: a rowing workout sits on the rowing machine's `seat`, a cycling workout on the exercise bike's `saddle`, a sit-up lies on the exercise mat's `surface`, and a sled push takes the sled's `left` and `right` handles and moves it.
 *
 * A body sitting or lying is read by its hip joints: above the support's place, within a fifth of the stature of it (a seated or lying pelvis's own depth with room, an estimate), and within 0.3 m of it on the floor plan. The sled stands 0.35 m ahead of the pusher, its handles within the arms' reach (a sled 0.6 m ahead is refused, the fists short of its handles) and is pushed 4 m.
 *
 * Scenarios, on the average man and the small woman, the rowing machine 1.5 m to the left, the bike 1.5 m to the right and the mat 1.5 m behind:
 * 1. Rowing `on` the machine's `seat`: at `catch1` the hip joints are 0 to a fifth of the stature above the seat and within 0.3 m of it on the floor plan.
 * 2. Cycling `on` the bike's `saddle`: the same at `leftBottom1`.
 * 3. A sit-up `on` the mat's `surface`: the same at `down1`.
 * 4. The sled push plans; from its `gripped` instant to its end, read every quarter of a second, the sled is held in both fists by its own handles: each handle lies within 15 mm of its hand's grip socket (the campaign's contact bound), and the sled moves at least 2 m along the push.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the workouts and the push through the public chain with the real machines and reads displayed joints and prop frames against the machines' own affordances; a body that sits or lies where its own measure would put it, or a push that leaves the handles or the sled behind, fails with the distance.
 * @evidence contracts/development/testing.md#independent-expectations The places are the archetypes' affordances carried by the props' placements; the bounds are one stated estimate and one provisional bound; nothing is read from the laws but their events.
 * @evidence contracts/development/testing.md#distinguishing-cases A seat, a saddle, a floor surface and a pushed load, each off the performer's own place, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and two films each; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the bounds and the 4 scenarios.
 */
export function test_archetype_gym_used(): void {
  const rower: ReturnType<typeof createRowingMachine> = createRowingMachine();
  const bike: ReturnType<typeof createExerciseBike> = createExerciseBike();
  const mat: ReturnType<typeof createExerciseMat> = createExerciseMat({
    kind: "gym",
  });
  const sled: ReturnType<typeof createSled> = createSled();
  const places: Readonly<Record<"rower" | "bike" | "mat", IAutoMovieVector3>> =
    {
      rower: { x: 1.5, y: 0, z: 0 },
      bike: { x: -1.5, y: 0, z: 0 },
      mat: { x: 0, y: 0, z: -1.5 },
    };
  const supports: ReadonlyArray<
    readonly [
      string,
      string,
      "rower" | "bike" | "mat",
      string,
      IAutoMovieVector3,
    ]
  > = [
    [
      "rowing",
      "catch1",
      "rower",
      "seat",
      rower.affordance("seat").frame.translation,
    ],
    [
      "cycling",
      "leftBottom1",
      "bike",
      "saddle",
      bike.affordance("saddle").frame.translation,
    ],
    [
      "sitUp",
      "down1",
      "mat",
      "surface",
      mat.affordance("surface").frame.translation,
    ],
  ];
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    const performer: HumanPerformance.IInput["performers"][number] = {
      subject: "a",
      body,
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" },
    };
    const when = (
      film: HumanPerformance,
      row: string,
      event: string,
    ): number => {
      const found: HumanSegment.ISegment = film
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.name === row)!;
      return (
        found.start +
        (found.plan.events.find((e): boolean => e.name === event)?.share ??
          Number.NaN) *
          found.plan.duration
      );
    };

    // 1 to 3. Seated and lying on the machines and the mat.
    try {
      let chain: HumanChain = HumanChain.subject("a").stand({ seconds: 0.3 });
      for (const [row, , prop, affordance] of supports)
        chain = chain
          .registered(row, { reps: 1, on: { prop, affordance } })
          .stand({ seconds: 0.3 });
      const film: HumanPerformance = new HumanPerformance({
        seed: "gym",
        laws: [
          HumanSportWorkout.rowing,
          HumanSportWorkout.cycling,
          HumanSportWorkout.sitUp,
        ],
        performers: [performer],
        props: [
          HumanObject.prop("rower", rower, { at: places.rower, yaw: 0 }),
          HumanObject.prop("bike", bike, { at: places.bike, yaw: 0 }),
          HumanObject.prop("mat", mat, { at: places.mat, yaw: 0 }),
        ],
        composition: chain.node,
      });
      const reader: HumanSignature.IReader = HumanSignature.of(
        film,
        "a",
        body,
        0,
      );
      for (const [row, event, prop, , local] of supports) {
        const seconds: number = when(film, row, event);
        const hips: IAutoMovieVector3 = Vector3.lerp(
          HumanSignature.joint(reader, seconds, "leftUpperLeg"),
          HumanSignature.joint(reader, seconds, "rightUpperLeg"),
          0.5,
        );
        const place: IAutoMovieVector3 = Vector3.add(places[prop], local);
        const above: number = hips.y - place.y;
        const off: number = Math.hypot(hips.x - place.x, hips.z - place.z);
        if (!(above >= 0 && above <= 0.2 * stature && off <= 0.3))
          complaints.push(
            `${name} ${row}: at ${event} the hip joints are ${above.toFixed(3)} m above the ${prop}'s place (0 to ${(0.2 * stature).toFixed(3)} m) and ${off.toFixed(3)} m from it on the floor plan (0.3 m)`,
          );
      }
    } catch (error) {
      complaints.push(
        `${name} workouts: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 4. The sled push.
    try {
      const start: IAutoMovieVector3 = { x: 0, y: 0, z: 0.35 };
      const film: HumanPerformance = new HumanPerformance({
        seed: "sled",
        laws: [HumanSportCarry.sledPush],
        performers: [performer],
        props: [HumanObject.prop("sled", sled, { at: start, yaw: 0 })],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered("sledPush", { sled: "sled", to: { x: 0, y: 0, z: 4 } })
          .node,
      });
      const end: number = film.duration;
      const frame: IHumanProp.IFrame = film.prop("sled", end);
      const gripped: number = when(film, "sledPush", "gripped");
      const offs: string[] = [];
      let off: number = 0;
      for (const side of ["left", "right"] as const) {
        // The handle against its fist, the grip socket closed on it.
        let worst: number = 0;
        for (let s: number = gripped + 0.05; s <= end; s += 0.25) {
          const socket: IHumanBody["surfaces"]["sockets"]["gripLeft"] =
            body.surfaces.sockets[side === "left" ? "gripLeft" : "gripRight"];
          const fist: IAutoMovieVector3 =
            resolveAutoMovieHumanoidSurfaces.place(
              socket,
              film.bones("a", s).get(socket.bone)!,
            ).point;
          const placed: IHumanProp.IFrame = film.prop("sled", s);
          const handle: IAutoMovieVector3 = Vector3.add(
            placed.position,
            Quaternion.rotateVector(
              placed.rotation,
              sled.affordance(side).frame.translation,
            ),
          );
          worst = Math.max(
            worst,
            Vector3.length(Vector3.subtract(fist, handle)),
          );
        }
        off = Math.max(off, worst);
        offs.push(`${side} ${(worst * 1000).toFixed(1)} mm`);
      }
      if (!(off <= 0.015))
        complaints.push(
          `${name} sled: after the grip the handles lie off their fists by ${offs.join(", ")}, within 15 mm expected`,
        );
      const moved: number = frame.position.z - start.z;
      if (!(moved >= 2))
        complaints.push(
          `${name} sled: the sled moves ${moved.toFixed(3)} m along the push, at least 2 m expected`,
        );
    } catch (error) {
      complaints.push(
        `${name} sled: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  TestValidator.equals("the gym machines serve their workouts", complaints, []);
}
