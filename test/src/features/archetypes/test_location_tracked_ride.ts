import {
  createCoasterCar,
  createEnvironment,
  createTrackedCourse,
  createTrackedRide,
} from "@automovie/archetypes/environments";
import {
  Quaternion,
  Vector3,
  bakedTransformFromClipsAt,
  validateModel,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieGeometry,
  IAutoMovieModel,
  IAutoMoviePropSpec,
  IAutoMovieTrackCourse,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { locationTrackedRideFixture } from "../internal/locationTrackedRideFixture";
import { locationTrackedRidePassenger } from "../internal/locationTrackedRidePassenger";
import { nclose, qclose, vclose } from "../internal/predicates";
import { throwsError } from "../internal/throwsError";

/**
 * Course geometry and the rendered carrier use the same measured frames,
 * including pauses and banking.
 *
 * Scenarios:
 *
 * 1. A 3-4-5 straight grade yields a known forward vector and 30-degree bank.
 * 2. A nonplanar loop joins its own frame, rail sections and held station. Live
 *    motion keeps a seated rider in the carrier's frame throughout the lapped
 *    course.
 * 3. Invalid bank basis, station without a dwell and inclined boarding are refused
 *    at the authoring seam.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies each observable frame, seam, stop and authoring refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads a scene environment's emitted mesh, prop and object-motion clip and an existing seated ride action.
 * @evidence contracts/development/testing.md#independent-expectations A 3-4-5 grade, 30-degree trigonometry, local cross-section coordinates and constant carrier-relative seat supply separate spatial oracles.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts an exact linear grade with a twisting loop, start and end stops with moving samples, and accepted default and malformed boarding.
 * @evidence contracts/development/testing.md#execution-ownership Builds one closed scenery fixture and reuses its published data for the motion and geometry tests.
 */
export function test_location_tracked_ride(): void {
  const line: IAutoMovieTrackCourse.IPrepared = createTrackedCourse({
    points: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 3, z: 4 },
    ],
    banks: [30, 30],
  });
  const middle: IAutoMovieTransform = line.frame(2.5);
  TestValidator.predicate(
    "metric travel, grade and bank are distinct",
    nclose(line.length, 5, 1e-12) &&
      vclose(middle.translation, { x: 0, y: 1.5, z: 2 }, 1e-12) &&
      vclose(
        Quaternion.rotateVector(middle.rotation, { x: 0, y: 0, z: 1 }),
        { x: 0, y: 0.6, z: 0.8 },
        1e-12,
      ) &&
      vclose(
        Quaternion.rotateVector(middle.rotation, { x: 1, y: 0, z: 0 }),
        { x: Math.sqrt(3) / 2, y: 0.4, z: -0.3 },
        1e-12,
      ),
  );

  const fixture: ReturnType<typeof locationTrackedRideFixture> =
    locationTrackedRideFixture();
  const { environment, course, carrier } = fixture;
  const first: IAutoMovieTransform = course.frame(0);
  const seam: IAutoMovieTransform = course.frame(course.length - 1e-7);
  const at = (time: number): IAutoMovieTransform =>
    bakedTransformFromClipsAt(
      environment.runtime.objectMotions,
      carrier,
      time,
    )!;
  const wait: IAutoMovieTransform = at(1);
  const arrive: IAutoMovieTransform = at(14);
  TestValidator.predicate(
    "one platform and a continuous closed frame",
    vclose(seam.translation, first.translation, 1e-6) &&
      qclose(seam.rotation, first.rotation, 1e-7) &&
      vclose(wait.translation, arrive.translation, 1e-12) &&
      qclose(wait.rotation, arrive.rotation, 1e-12) &&
      environment.stage.space?.surfaces.length === 1,
  );

  // Check the positive-X rail's top edge against the carrier at the same section.
  const rails: IAutoMovieModel = environment.runtime.models.find(
    (model: IAutoMovieModel): boolean => model.id === "park/coaster/track",
  )!;
  TestValidator.predicate(
    "track is an admitted generated model",
    validateModel({ model: rails }).success,
  );
  const rail: IAutoMovieGeometry = rails.parts[1]!.geometry;
  if (rail.type !== "mesh") throw new Error("Ride rail is not an indexed mesh");
  const index: number = Math.floor(course.stations.length / 3);
  const seconds: number = 4 + (9 * course.stations[index]!) / course.length;
  const root: IAutoMovieTransform = at(seconds);
  const top: IAutoMovieVector3 = Vector3.add(
    { x: 4, y: 0, z: -7 },
    Vector3.scale(
      Vector3.add(
        readPoint(rail.mesh.positions, 4 * index + 2),
        readPoint(rail.mesh.positions, 4 * index + 3),
      ),
      0.5,
    ),
  );
  TestValidator.predicate(
    "the carrier follows the banked rail section",
    vclose(
      Quaternion.rotateVector(
        Quaternion.inverse(root.rotation),
        Vector3.subtract(top, root.translation),
      ),
      { x: 0.6, y: 0, z: 0 },
      1e-9,
    ) &&
      (rail.mesh.indices?.some(
        (value: number, i: number, all: number[]): boolean =>
          i > all.length - 25 && value === 0,
      ) ??
        false),
  );

  const car: IAutoMovieModel = environment.runtime.props.find(
    (prop: IAutoMoviePropSpec): boolean => prop.node === carrier,
  )!.model;
  const seatContact: IAutoMovieAffordance = car.affordances!.find(
    (contact: IAutoMovieAffordance): boolean => contact.id === "seat",
  )!;
  const { film, actor, body } = locationTrackedRidePassenger(fixture);
  const reader: ReturnType<typeof HumanSignature> = HumanSignature(
    film,
    actor.node,
    body,
    0,
  );
  const seatRelative = (t: number): IAutoMovieVector3 => {
    const frame: IAutoMovieTransform = at(t);
    return Vector3.subtract(
      Quaternion.rotateVector(
        Quaternion.inverse(frame.rotation),
        Vector3.subtract(
          HumanSignature.region(reader, "seat", t),
          frame.translation,
        ),
      ),
      seatContact.frame.translation,
    );
  };
  const segment: ReturnType<typeof film.segments>[number] = film.segments(
    actor.node,
  )[1]!;
  const offset: IAutoMovieVector3 = seatRelative(3.5);
  TestValidator.predicate(
    "boarding settles the sitter on the actual cushion before departure",
    segment.entryTime < 3.5 &&
      nclose(offset.y, 0, 0.001) &&
      Math.abs(offset.x) < seatContact.width! / 2 &&
      offset.z < 0 &&
      offset.z > -seatContact.depth!,
  );
  const initialRotation: IAutoMovieTransform["rotation"] = Quaternion.multiply(
    Quaternion.inverse(at(3.5).rotation),
    film.pose(actor.node, 3.5).root!.rotation,
  );
  for (const t of [3.99, 4.01, 5, 8, 11, 13.2])
    TestValidator.predicate(
      "the seated rider stays fixed against the baked carrier",
      vclose(seatRelative(t), offset, 0.01) &&
        qclose(
          Quaternion.multiply(
            Quaternion.inverse(at(t).rotation),
            film.pose(actor.node, t).root!.rotation,
          ),
          initialRotation,
          1e-10,
        ),
    );

  // Use the sloped course as a negative station. Its valid vehicle still cannot dock there.
  const badRide: ReturnType<typeof createTrackedRide> = createTrackedRide({
    course: line,
    car: createCoasterCar(),
    boarding: "boarding",
    schedule: [
      { seconds: 0, distance: 0 },
      { seconds: 2, distance: 0 },
    ],
    stops: { failure: 0 },
  });
  TestValidator.predicate(
    "inclined boarding, no dwell and a parallel lateral are diagnosed",
    throwsError(
      (): ReturnType<typeof createEnvironment> =>
        createEnvironment({ id: "bad", items: { ride: { use: badRide } } }),
      "level",
    ) &&
      throwsError(
        (): IAutoMovieTrackCourse.IPrepared =>
          createTrackedCourse({
            points: [
              { x: 0, y: 0, z: 0 },
              { x: 0, y: 0, z: 4 },
            ],
            lateral: { x: 0, y: 0, z: 1 },
          }),
        "parallel",
      ) &&
      throwsError(
        (): ReturnType<typeof createTrackedRide> =>
          createTrackedRide({
            course,
            car: createCoasterCar(),
            boarding: "boarding",
            schedule: [
              { seconds: 0, distance: 0 },
              { seconds: 2, distance: course.length },
            ],
            stops: { failure: 0 },
          }),
        "dwell",
      ),
  );
}

/** Read the triple at a known indexed-mesh vertex. */
function readPoint(values: readonly number[], i: number): IAutoMovieVector3 {
  return { x: values[3 * i]!, y: values[3 * i + 1]!, z: values[3 * i + 2]! };
}
