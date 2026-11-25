import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypePassage,
  createHorse,
  rideQuadruped,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../internal/assertTakeClean";
import { motionHumanBody } from "../../../internal/motionHumanBody";

/** The horse producer's model. */
type Horse = ReturnType<typeof createHorse>;

/** A horse's timed ride. */
type Ride = ReturnType<typeof rideQuadruped<string, string>>;

/** A floor axis of the ride's root frame. */
type Axis = "x" | "z";

/** Seconds the rider takes to sit before the ride sets off. */
const MOUNT: number = 4.5;

/** Seconds between envelope reads. */
const STEP: number = 0.25;

/** The rider attachment contract's 10 mm contact budget, metres. */
const CONTACT: number = 0.01;

/**
 * A seated rider counts in a mounted passage: the ride's envelope holds every displayed bone of its rider as well as the horse and its tack.
 *
 * Scenarios:
 *
 * 1. Through a timed ride with a curve, the rider keeps the seat within the contact budget.
 * 2. Every displayed bone of the rider, at every read, lies inside the envelope that counts it.
 * 3. That envelope holds the horse-only envelope, so counting the rider never shrinks the footprint.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the ride, the rider and the three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Seats a real rider on a real timed ride through `HumanPerformance` and measures `AutoMovieArchetypePassage.envelope` with the rider's displayed bones carried.
 * @evidence contracts/development/testing.md#independent-expectations The contact budget is the rider attachment contract's 10 mm. A bone inside the floor rectangle lies between its least and greatest root-frame coordinates, which the test reads back from the ride's own placement.
 * @evidence contracts/development/testing.md#distinguishing-cases The envelope with and without the rider, on a straight start and a curve. Passage conflicts are pinned by test_archetypes_mounted_passage.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only feature spec through the public performance path.
 */
export function test_motions_mounted_rider_envelope(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: Horse = createHorse(
    { withersHeight: 1.72, stirrupDrop: 0.66, tempo: 0 },
    5,
  );
  const plan: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.timed(
    "hazel",
    [
      { seconds: 0, x: 0, y: 0, z: 0 },
      { seconds: 3, x: 0, y: 0, z: 4.5 },
      { seconds: 6, x: 1.5, y: 0, z: 8.5 },
      { seconds: 9, x: 4, y: 0, z: 11 },
    ],
  );
  const ride: Ride = rideQuadruped(horse, plan);
  const local: (at: number) => number = (at: number): number =>
    Math.max(0, Math.min(ride.duration, at - MOUNT));
  const place: (at: number) => IAutoMovieRigidTransform = (
    at: number,
  ): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = ride.at(local(at)).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const part: (id: string, at: number) => IAutoMovieTransform = (
    id: string,
    at: number,
  ): IAutoMovieTransform =>
    ride.frame(id as Parameters<Ride["frame"]>[0], local(at));
  const saddle: ReturnType<typeof HumanObject.seat> = HumanObject.seat(
    ride.at(0).archetype,
    place(0),
    undefined,
    "horse",
  );
  const film: HumanPerformance = new HumanPerformance({
    seed: "rider-envelope",
    performers: [
      {
        subject: "rider",
        body,
        at: HumanFrame.point(
          { origin: { ...saddle.at, y: 0 }, yaw: saddle.yaw },
          { x: 0.6, y: 0, z: -0.2 },
        ),
        yaw: saddle.yaw,
        proficiency: { level: "trained" },
      },
    ],
    laws: [AutoMovieMotionHumanMount.rideHorse.ride],
    props: [HumanObject.prop("horse", horse, place(0), place, part)],
    composition: HumanChain.subject("rider")
      .sit({ seat: saddle, hold: 0.5 })
      .registered("ride", {
        on: "horse",
        duration: MOUNT + ride.duration,
        seat: "seat",
        feet: { left: "leftStirrup", right: "rightStirrup" },
      }).node,
  });
  assertTakeClean("seated rider on a timed ride", film);
  const reads: number[] = Array.from(
    { length: Math.floor(ride.duration / STEP) + 1 },
    (_: unknown, k: number): number => k * STEP,
  );
  const bones: (seconds: number) => IAutoMovieVector3[] = (
    seconds: number,
  ): IAutoMovieVector3[] =>
    Array.from(
      film.bones("rider", MOUNT + seconds).values(),
      (bone) => bone.worldPosition,
    );

  // 1. The seat holds.
  const offsets: number[] = reads.map((seconds: number): number =>
    Vector3.distance(
      film.bones("rider", MOUNT + seconds).get("hips")!.worldPosition,
      part("seat", MOUNT + seconds).translation,
    ),
  );
  TestValidator.predicate(
    `the rider keeps the seat through the curve: ${(Math.max(...offsets) - Math.min(...offsets)).toFixed(4)}`,
    Math.max(...offsets) - Math.min(...offsets) <= CONTACT,
  );

  // 2. Every bone inside the envelope that counts it.
  const counted: AutoMovieArchetypePassage.IFootprint =
    AutoMovieArchetypePassage.envelope(ride, 0, ride.duration, STEP, bones);
  const bound: (
    footprint: AutoMovieArchetypePassage.IFootprint,
    axis: Axis,
    pick: (...v: number[]) => number,
  ) => number = (
    footprint: AutoMovieArchetypePassage.IFootprint,
    axis: Axis,
    pick: (...v: number[]) => number,
  ): number =>
    pick(...footprint.outline.map((p: IAutoMovieVector3): number => p[axis]));
  const inside: boolean = reads.every((seconds: number): boolean => {
    const placement: IAutoMovieTransform = ride.at(seconds).placement;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      placement.rotation,
    );
    return bones(seconds).every((point: IAutoMovieVector3): boolean => {
      const root: IAutoMovieVector3 = Quaternion.rotateVector(
        inverse,
        Vector3.subtract(point, placement.translation),
      );
      return (
        root.x >= bound(counted, "x", Math.min) - 1e-9 &&
        root.x <= bound(counted, "x", Math.max) + 1e-9 &&
        root.z >= bound(counted, "z", Math.min) - 1e-9 &&
        root.z <= bound(counted, "z", Math.max) + 1e-9
      );
    });
  });
  TestValidator.predicate(
    "every rider bone lies inside the counted envelope",
    inside,
  );

  // 3. Counting the rider never shrinks the footprint.
  const bare: AutoMovieArchetypePassage.IFootprint =
    AutoMovieArchetypePassage.envelope(ride, 0, ride.duration, STEP);
  TestValidator.predicate(
    "the counted envelope holds the horse-only envelope",
    bound(counted, "x", Math.min) <= bound(bare, "x", Math.min) &&
      bound(counted, "x", Math.max) >= bound(bare, "x", Math.max) &&
      bound(counted, "z", Math.min) <= bound(bare, "z", Math.min) &&
      bound(counted, "z", Math.max) >= bound(bare, "z", Math.max),
  );
}
