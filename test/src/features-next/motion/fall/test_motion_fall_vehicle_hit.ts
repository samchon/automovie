import { createCar } from "@automovie/archetypes";
import {
  physicalShapeBounds,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeBounds,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanFall,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanRefusal } from "../../../features/internal/motionHumanRefusal";

/** A braking car's deceleration, metres per second squared: 0.7 g, a hard stop on dry asphalt. */
const BRAKE: number = 0.7 * 9.81;

/** The hips' largest height over the road when lying, metres. */
const LYING: number = 0.3;

/** The two acts the cases perform. */
type Act = "vehicleHit" | "vehicleDive";

/** A car's place on its course. */
interface IAt {
  /** The floor point under its origin, world metres. */
  at: IAutoMovieVector3;

  /** Its yaw, degrees. */
  yaw: number;
}

/** A car's straight course along `+Z` toward the pedestrian at the origin. */
interface ICourse {
  /** Where the car's origin starts on `Z`, metres. */
  from: number;

  /** Its speed, metres per second. */
  speed: number;

  /** Its offset across the course on `X`, metres. */
  aside: number;

  /** Where its origin starts braking on `Z`, metres; it never brakes when absent. */
  brake?: number;
}

/**
 * The vehicle hit and the near-miss dive (#3973).
 *
 * Scenarios, on the average man and the small woman, crossing in front of a
 * car coming along `+Z`:
 * 1. A sedan at 8 m/s, braking hard once its middle has passed where the
 *    pedestrian stood, wraps a body whose centre of mass stands above the
 *    top of its front onto its bonnet, and projects one below it (Ravani et
 *    al.'s rule): a wrapped body's hips lie over the car, no further ahead
 *    of its front than the thigh's radius and within its width, above
 *    that top, at the separation; the body ends lying on the road ahead.
 * 2. A box-fronted truck taller than the hips projects the body forward;
 *    it ends lying ahead of where it stood.
 * 3. A car whose course passes wide of the pedestrian, and a car that never
 *    moves, are refused naming the vehicle.
 * 4. A pedestrian facing the oncoming sedan dives aside, leaving its width by its arrival, its every joint
 *    outside the car's half width at that instant; a car arriving at once is
 *    refused.
 * Every take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each case, its bounds and the refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed hips and joints at the plan's events against the car's own course and size, and every take through the shipped verdicts.
 * @evidence contracts/development/testing.md#independent-expectations The classes are the source's own cases (an adult and a sedan wrap; a front above the hips projects); the car's place and size are the scene's course and the archetype's dimensions.
 * @evidence contracts/development/testing.md#distinguishing-cases Wrap, forward projection, a miss, a still car, a dive and a late dive, on two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_motion_fall_vehicle_hit(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const sedan: ReturnType<typeof createCar> = createCar({ kind: "sedan" }, 3);
  const length: number = sedan.dimensions.length!;
  const width: number = sedan.dimensions.width!;
  // The top of the sedan's front: its colliders reaching within a bumper's
  // depth of the foremost, read in its own frame.
  const still: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const boxes: IAutoMoviePhysicalShapeBounds.IResult[] = sedan
    .shapes()
    .map(
      (shape: IAutoMoviePhysicalShape): IAutoMoviePhysicalShapeBounds.IResult =>
        physicalShapeBounds(still, shape),
    );
  const foremost: number = Math.max(
    ...boxes.map((b: IAutoMoviePhysicalShapeBounds.IResult): number => b.max.z),
  );
  const top: number = Math.max(
    ...boxes
      .filter(
        (b: IAutoMoviePhysicalShapeBounds.IResult): boolean =>
          b.max.z >= foremost - 0.15,
      )
      .map((b: IAutoMoviePhysicalShapeBounds.IResult): number => b.max.y),
  );
  const placed: (course: ICourse) => (seconds: number) => IAt =
    (course: ICourse) =>
    (seconds: number): IAt => {
      const cruise: number = course.from + course.speed * seconds;
      if (course.brake === undefined || cruise <= course.brake)
        return { at: { x: course.aside, y: 0, z: cruise }, yaw: 0 };
      const t0: number = (course.brake - course.from) / course.speed;
      const s: number = Math.min(seconds - t0, course.speed / BRAKE);
      return {
        at: {
          x: course.aside,
          y: 0,
          z: course.brake + course.speed * s - 0.5 * BRAKE * s * s,
        },
        yaw: 0,
      };
    };
  const car: (course: ICourse) => IAutoMovieMotionHumanProp = (
    course: ICourse,
  ): IAutoMovieMotionHumanProp =>
    HumanObject.prop("car", sedan, placed(course)(0), placed(course));
  // A box-fronted truck: one box 1.6 m tall, 2.4 m wide and 6 m long.
  const truck: (course: ICourse) => IAutoMovieMotionHumanProp = (
    course: ICourse,
  ): IAutoMovieMotionHumanProp => ({
    subject: "car",
    frame: {
      position: { x: course.aside, y: 0, z: course.from },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    shapes: [
      {
        id: "box",
        material: "steel",
        transform: {
          position: { x: 0, y: 0.8, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        kind: "box",
        halfExtents: { x: 1.2, y: 0.8, z: 3 },
      },
    ],
    motion: (seconds: number): IAutoMovieRigidTransform => ({
      position: placed(course)(seconds).at,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    }),
  });
  const coming: ICourse = {
    from: -(length + 8),
    speed: 8,
    aside: 0,
    brake: 0.5,
  };
  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    const perform: (
      prop: IAutoMovieMotionHumanProp,
      act: Act,
    ) => HumanPerformance = (
      prop: IAutoMovieMotionHumanProp,
      act: Act,
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "vehicle-hit",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            // Crossing the car's course when struck; facing the oncoming car when diving aside.
            yaw: act === "vehicleDive" ? 180 : 90,
            proficiency: { level: "trained" },
          },
        ],
        props: [prop],
        laws: [
          AutoMovieMotionHumanFall.vehicleHit.vehicleHit,
          AutoMovieMotionHumanFall.vehicleHit.vehicleDive,
        ],
        composition: HumanChain.subject("a").registered(act, { vehicle: "car" })
          .node,
      });
    const segment: (take: HumanPerformance) => IAutoMovieMotionHumanSegment = (
      take: HumanPerformance,
    ): IAutoMovieMotionHumanSegment =>
      take
        .segments("a")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean =>
            s.law.name === "vehicleHit" || s.law.name === "vehicleDive",
        )!;
    const when: (take: HumanPerformance, name: string) => number = (
      take: HumanPerformance,
      name: string,
    ): number => {
      const s: IAutoMovieMotionHumanSegment = segment(take);
      const event: IAutoMovieMotionEvent | undefined = s.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === name,
      );
      return event === undefined
        ? NaN
        : s.start + event.share * (s.end - s.start);
    };
    const hips: (
      take: HumanPerformance,
      seconds: number,
    ) => IAutoMovieVector3 = (
      take: HumanPerformance,
      seconds: number,
    ): IAutoMovieVector3 => take.bones("a", seconds).get("hips")!.worldPosition;

    // 1. The wrap.
    try {
      const take: HumanPerformance = perform(car(coming), "vehicleHit");
      assertTakeClean(`${fit} struck by a sedan`, take);
      // Ravani et al.'s rule on this car's own front: a centre of mass above
      // the top of its foremost colliders wraps, one below is projected.
      const centre: number = resolveAutoMovieCenterOfMass.place(
        body.massModel,
        take.bones("a", 0),
      ).y;
      const wraps: boolean = centre > top;
      all.check(
        `${fit} a sedan ${wraps ? "wraps" : "projects"} a body whose centre of mass is ${centre.toFixed(3)} m against its ${top.toFixed(3)} m front`,
        !Number.isNaN(when(take, wraps ? "wrap" : "forwardProjection")),
      );
      if (wraps) {
        const off: number = when(take, "separate");
        const ride: IAutoMovieVector3 = hips(take, off);
        const carAt: IAutoMovieVector3 = placed(coming)(off).at;
        all.check(
          `${fit} rides over the car's footprint at the separation (${(ride.z - carAt.z).toFixed(3)} m along, ${ride.x.toFixed(3)} m across, ${ride.y.toFixed(3)} m up)`,
          ride.z - carAt.z <= foremost + body.measure.thighRadius &&
            ride.z - carAt.z >= foremost - length &&
            Math.abs(ride.x - carAt.x) <= width / 2 &&
            ride.y >= top,
        );
      }
      const end: IAutoMovieVector3 = hips(take, segment(take).end);
      all.check(
        `${fit} ends lying on the road ahead (${end.z.toFixed(3)} m on, hips ${end.y.toFixed(3)} m)`,
        end.y <= LYING && end.z > 0,
      );
    } catch (error: unknown) {
      all.check(`${fit} struck by a sedan: ${String(error)}`, false);
    }

    // 2. The forward projection.
    try {
      const take: HumanPerformance = perform(
        truck({ from: -12, speed: 6, aside: 0, brake: -2 }),
        "vehicleHit",
      );
      assertTakeClean(`${fit} struck by a truck`, take);
      all.check(
        `${fit} a front above the hips projects the body`,
        !Number.isNaN(when(take, "forwardProjection")),
      );
      const end: IAutoMovieVector3 = hips(take, segment(take).end);
      all.check(
        `${fit} ends lying ahead of where it stood (${end.z.toFixed(3)} m)`,
        end.y <= LYING && end.z > 0.5,
      );
    } catch (error: unknown) {
      all.check(`${fit} struck by a truck: ${String(error)}`, false);
    }

    // 3. The refusals.
    all.check(
      `${fit} a car passing wide is refused`,
      motionHumanRefusal(
        () =>
          perform(car({ ...coming, aside: 5 }), "vehicleHit").bones("a", 0.5),
        { kind: "reach", axis: "vehicle", act: "vehicleHit" },
      ),
    );
    all.check(
      `${fit} a still car is refused`,
      motionHumanRefusal(
        () =>
          perform(
            HumanObject.prop("car", sedan, {
              at: { x: 0, y: 0, z: -6 },
              yaw: 0,
            }),
            "vehicleHit",
          ).bones("a", 0.5),
        { kind: "reach", axis: "vehicle", act: "vehicleHit" },
      ),
    );

    // 4. The dive.
    try {
      // The pedestrian stands inside the car's width, 0.7 m off its centre line:
      // a lying body is longer than a dive's reach is wide.
      const passing: ICourse = { from: -(length + 16), speed: 8, aside: -0.7 };
      const take: HumanPerformance = perform(car(passing), "vehicleDive");
      assertTakeClean(`${fit} dives clear`, take);
      const arrival: number = when(take, "arrival");
      const carAt: IAutoMovieVector3 = placed(passing)(arrival).at;
      const inside: AutoMovieHumanoidBone[] = [
        ...take.bones("a", arrival).entries(),
      ]
        .filter(
          ([, bone]: [
            AutoMovieHumanoidBone,
            IAutoMovieResolvedBone,
          ]): boolean => Math.abs(bone.worldPosition.x - carAt.x) <= width / 2,
        )
        .map(
          ([name]: [
            AutoMovieHumanoidBone,
            IAutoMovieResolvedBone,
          ]): AutoMovieHumanoidBone => name,
        );
      all.check(
        `${fit} every joint is clear of the car's width at its arrival (${inside.join(", ")})`,
        inside.length === 0,
      );
    } catch (error: unknown) {
      all.check(`${fit} dives clear: ${String(error)}`, false);
    }
    all.check(
      `${fit} a dive the car arrives before is refused`,
      motionHumanRefusal(
        () =>
          perform(
            car({ from: -(length / 2 + 0.5), speed: 8, aside: -0.7 }),
            "vehicleDive",
          ).bones("a", 0.5),
        { kind: "reach", axis: "vehicle", act: "vehicleDive" },
      ),
    );
  }
  all.assert("vehicle hit");
}
