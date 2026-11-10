import {
  Quaternion,
  Vector3,
  resolveAutoMovieFraming,
  resolveAutoMovieRelationalGoal,
  resolveAutoMovieZone,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/** Relational goals, framing and zones resolve from named subjects, never from coordinates in the scene.
 *
 * Scenarios:
 * 1. A polygon man's hand reaches another polygon man's head region; `freeze` reads the target at the window start, `track` at the instant, and outside the window the prior returns unchanged.
 * 2. Framing places the camera on its bearing and elevation at r / (fill tan(fov / 2)) from the subjects' centre, and refuses an unknown subject.
 * 3. A zone resolves its centre, a landmark and a bearing share of its radius, and refuses an unknown landmark.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `resolveAutoMovieFraming`, `resolveAutoMovieRelationalGoal`, `resolveAutoMovieZone` on in-memory inputs and asserts the returned observations through 4x TestValidator.predicate, 1x TestValidator.equals; 3 numbered scenarios (first: A polygon man's hand reaches another polygon man's head region; `freeze` reads the target at the window...; last: A zone resolves its centre, a landmark and a bearing share of its radius, and refuses an unknown landmark.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (4 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: A polygon man's hand reaches another polygon man's head region; `freeze` reads the target at the window...; last: A zone resolves its centre, a landmark and a bearing share of its radius, and refuses an unknown landmark.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_composition_relations`, which owns the cases delegated to `PhysicalModelFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A polygon man's hand reaches another polygon man's head region; `freeze` reads the target at the window start, `track` at the instant, and...).
 */
export function test_composition_relations(): void {
  const { profile } = PhysicalModelFixtures.stickman();
  const neutral = (offset: IAutoMovieVector3): Record<string, P.ITransform> =>
    Object.fromEntries(
      profile.segments.map((s: P.ISegment): [string, P.ITransform] => [
        s.bone,
        {
          position: Vector3.add(s.neutral.position, offset),
          rotation: { ...s.neutral.rotation },
        },
      ]),
    );
  const body = (
    offset: (seconds: number) => IAutoMovieVector3,
  ): resolveAutoMovieRelationalGoal.IBody => ({
    profile,
    pose: (seconds: number) => neutral(offset(seconds)),
    regions: { head: { bone: "head", localPoint: { x: 0, y: 0.1, z: 0 } } },
    support: () => ({
      bone: "leftLowerLeg",
      localPoint: { x: 0, y: -0.396, z: 0 },
      normal: { x: 0, y: 1, z: 0 },
      minimum: -0.3,
      maximum: 0.3,
    }),
    bones: [
      "leftLowerLeg",
      "leftUpperLeg",
      "spine",
      "rightUpperArm",
      "rightLowerArm",
      "rightHand",
    ],
  });
  const bodies: Record<string, resolveAutoMovieRelationalGoal.IBody> = {
    a: body(() => ({ x: 0, y: 0, z: 0 })),
    b: body((seconds: number) => ({
      x: -0.9,
      y: -0.15,
      z: -0.4 - 0.1 * seconds,
    })),
  };
  const reach = (
    lock: "freeze" | "track",
    seconds: number,
  ): resolveAutoMovieRelationalGoal.IResult =>
    resolveAutoMovieRelationalGoal({
      performer: "a",
      goal: {
        surface: { bone: "rightHand", localPoint: { x: -0.05, y: 0, z: 0 } },
        target: { subject: "b", region: "head" },
        window: { start: 1, end: 2 },
        lock,
      },
      bodies,
      seconds,
    });
  const hand = (
    result: resolveAutoMovieRelationalGoal.IResult,
  ): IAutoMovieVector3 => {
    const pose: P.ITransform = result.targets.rightHand!;
    return Vector3.add(
      pose.position,
      Quaternion.rotateVector(pose.rotation, { x: -0.05, y: 0, z: 0 }),
    );
  };
  const frozen = reach("freeze", 1.5);
  const tracked = reach("track", 1.5);
  const outside = reach("track", 2.5);
  TestValidator.predicate(
    `frozen and tracked targets (${frozen.position}, ${tracked.position})`,
    frozen.active &&
      Math.abs(frozen.point!.z - (-0.4 - 0.1 * 1)) < 1e-12 &&
      Math.abs(tracked.point!.z - (-0.4 - 0.1 * 1.5)) < 1e-12 &&
      frozen.position < 0.01 &&
      tracked.position < 0.01 &&
      Vector3.length(Vector3.subtract(hand(frozen), frozen.point!)) < 0.01,
  );
  TestValidator.predicate(
    "outside the window the prior stands",
    !outside.active &&
      outside.point === null &&
      JSON.stringify(outside.targets) === JSON.stringify(bodies.a!.pose(2.5)),
  );

  // Framing two unit spheres 2 m apart: radius 2, fill 0.5, fov 60 degrees.
  const camera: resolveAutoMovieFraming.ICamera = resolveAutoMovieFraming(
    {
      subjects: ["a", "b"],
      fill: 0.5,
      bearing: Math.PI / 2,
      elevation: 0,
      fieldOfView: Math.PI / 3,
    },
    {
      a: { center: { x: -1, y: 1, z: 0 }, radius: 1 },
      b: { center: { x: 1, y: 1, z: 0 }, radius: 1 },
    },
  );
  const distance: number = 2 / (0.5 * Math.tan(Math.PI / 6));
  TestValidator.predicate(
    "framing distance and bearing",
    Math.abs(camera.radius - 2) < 1e-12 &&
      Math.abs(camera.position.x - distance) < 1e-9 &&
      Math.abs(camera.position.y - 1) < 1e-12 &&
      Math.abs(camera.position.z) < 1e-9,
  );

  // Zones.
  const zones = [
    {
      id: "corner",
      center: { x: 2, y: 0, z: 2 },
      radius: 1,
      landmarks: { post: { x: 2.5, y: 0, z: 2.5 } },
    },
  ];
  const toward: IAutoMovieVector3 = resolveAutoMovieZone(zones, "corner", {
    bearing: 0,
    share: 0.5,
  });
  TestValidator.predicate(
    "zone points",
    JSON.stringify(resolveAutoMovieZone(zones, "corner")) ===
      JSON.stringify({ x: 2, y: 0, z: 2 }) &&
      resolveAutoMovieZone(zones, "corner", "post").x === 2.5 &&
      Math.abs(toward.z - 2.5) < 1e-12 &&
      Math.abs(toward.x - 2) < 1e-12,
  );
  const refusals: string[] = [];
  for (const [label, run] of [
    [
      "unknown framed subject",
      () =>
        resolveAutoMovieFraming(
          {
            subjects: ["z"],
            fill: 0.5,
            bearing: 0,
            elevation: 0,
            fieldOfView: 1,
          },
          {},
        ),
    ],
    ["unknown landmark", () => resolveAutoMovieZone(zones, "corner", "rope")],
  ] as const)
    try {
      run();
      refusals.push(`${label} accepted`);
    } catch {}
  TestValidator.equals("relation refusals", refusals, []);
}
