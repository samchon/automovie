import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanRide,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject, HumanRefusal } from "@automovie/motions";
import {
  HumanRide,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { testAffordance } from "../../internal/fixtures/testAffordance";
import { motionActionContext } from "../../internal/motionActionContext";

/** Rider faces forward, with a 1 m range of travel and a 90-degree turn. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/** The rectangular driver cushion, in carrier coordinates in metres. */
const CUSHION: IAutoMovieVector3 = { x: 0.4, y: 0.45, z: -0.1 };

/** The carrier rotates only about its vertical axis. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The authored course is stationary before 3 s and after 7 s of film time. */
function course(film: number): IAutoMovieRigidTransform {
  const share: number = Math.max(0, Math.min(1, (film - 3) / 4));
  return {
    position: { x: 0, y: 0, z: share },
    rotation: Quaternion.fromAxisAngle(UP, 90 * share),
  };
}

/**
 * The ride carries a seated pelvis through a turn without leaving its cushion.
 *
 * Scenarios:
 * 1. A standing driver is refused and offered a sit.
 * 2. Read an authored seat across the course's stationary and turning phases.
 * 3. Revisit prior seconds after the turn and check the same physical bounds.
 */
export async function test_motions_lexicon_ride_cushion(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const region: IAutoMovieHumanoidSurfaces.IFrame = body.surfaces.regions.seat;
  const seatAt: IAutoMovieVector3 = {
    x: CUSHION.x,
    y: CUSHION.y,
    z: CUSHION.z + 0.25,
  };
  const carrier: IAutoMovieMotionHumanProp = HumanObject.prop(
    "carrier",
    { affordances: [testAffordance("driverSeat", "seat", seatAt)] },
    course(0),
    course,
  );
  const posture: IAutoMovieMotionHumanPosture = {
    root: Vector3.subtract(
      CUSHION,
      Vector3.add(body.rest.get(region.bone)!, region.point),
    ),
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const start: number = 2;
  const params: IAutoMovieMotionHumanRide.IParams = {
    on: carrier.subject,
    duration: 7,
    seat: "driverSeat",
  };
  const standing: IAutoMovieMotionHumanActionContext<
    IAutoMovieMotionHumanRide.IParams
  > = motionActionContext(body, params, { start, props: [carrier] });
  assert.throws(
    () => HumanRide.ride.plan(standing),
    (error: unknown): boolean =>
      error instanceof HumanRefusal &&
      error.kind === "base" &&
      error.feasible?.kind === "alternatives" &&
      error.feasible.values.includes("sit"),
  );

  const context: IAutoMovieMotionHumanActionContext<
    IAutoMovieMotionHumanRide.IParams
  > = motionActionContext(body, params, {
    start,
    posture,
    props: [carrier],
    base: { kind: "seated", seat: { at: seatAt, yaw: 0 } },
    supports: [
      {
        part: "seat",
        kind: "seat",
        support: { kind: "prop", subject: carrier.subject },
      },
    ],
  });
  const plan: ReturnType<typeof HumanRide.ride.plan> =
    HumanRide.ride.plan(context);
  const read: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    new Set<AutoMovieHumanoidBone>(["hips", region.bone]),
  );

  // The pre-turn, midpoint and post-turn expectations are independently
  // located from the metre of travel and the quarter turn over four seconds.
  const times: readonly number[] = [
    2, 3, 3.00001, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 9, 5, 2,
  ];
  for (const film of times) {
    const moved: number = film <= 3 ? 0 : film >= 7 ? 1 : (film - 3) * 0.25;
    const radians: number = moved * Math.PI * 0.5;
    const forward: IAutoMovieVector3 = {
      x: Math.sin(radians),
      y: 0,
      z: Math.cos(radians),
    };
    const sample: ReturnType<typeof plan.postureWithFrame> =
      plan.postureWithFrame(film - start);
    TestValidator.predicate(
      `the carrier follows its film-time course at ${film} s`,
        Vector3.distance(sample.frame.position, { x: 0, y: 0, z: moved }) <=
        1e-9 &&
        Vector3.distance(
          Quaternion.rotateVector(sample.frame.rotation, FORWARD),
          forward,
        ) <= 1e-9 &&
        Vector3.distance(Quaternion.rotateVector(sample.frame.rotation, UP), UP) <=
        1e-9,
    );

    const bones: ReturnType<typeof read> = read(
      resolveHumanPosture(body, sample.posture),
    );
    const actual: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
      region,
      bones.get(region.bone)!,
    ).point;
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(sample.frame.rotation),
      Vector3.subtract(actual, sample.frame.position),
    );
    const gap: number = Math.hypot(
      Math.max(0, Math.abs(local.x - CUSHION.x) - 0.2),
      local.y - CUSHION.y,
      Math.max(0, Math.abs(local.z - CUSHION.z) - 0.25),
    );
    TestValidator.predicate(
      `driver cushion gap at ${film} s is ${gap} m`,
      gap <= 0.01,
    );

    const hips: IAutoMovieResolvedBone = bones.get("hips")!;
    const facing: IAutoMovieVector3 = Quaternion.rotateVector(
      hips.worldRotation,
      FORWARD,
    );
    const heading: number = Math.abs(
      (Math.atan2(
        facing.x * forward.z - facing.z * forward.x,
        facing.x * forward.x + facing.z * forward.z,
      ) *
        180) /
        Math.PI,
    );
    TestValidator.predicate(
      `driver heading at ${film} s differs by ${heading} degrees`,
      heading <= 1,
    );
  }
}
