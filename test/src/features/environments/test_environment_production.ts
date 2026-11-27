import { AutoMovieEngineMotionSampling, AutoMovieEngineWorld, Quaternion, Vector3, AutoMovieEngineFilm, AutoMovieEngineSequence, AutoMovieEngineSpace } from "@automovie/engine";
import type {
  IAutoMovieMotion,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieStageActor,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanBody } from "@automovie/motions";
import { HumanFoot, poseBones } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";
import { bankedParkRide } from "./bankedParkRide";
import { bridgeCampus } from "./bridgeCampus";
import { compileEnvironmentExample } from "./compileEnvironmentExample";
import { environmentLiftSchedule } from "./environmentLiftSchedule";
import { hillsideStop } from "./hillsideStop";
import { pondTrail } from "./pondTrail";
import { railShuttle } from "./railShuttle";

/**
 * A reusable environment reaches an active production shot.
 *
 * Scenarios:
 *
 * 1. A graded approach, an operative building entry and a furnished café lower
 *    into one ordinary shot. Walkable height, the staged visitor and the door's
 *    animated track agree at the transition. The compiled wrist stays near the
 *    grip and its reading in the leaf frame moves under 5 mm.
 * 2. A building-free trail mounts a custom marker, a bench and one compact grove,
 *    with a wet region unavailable to the walking performer.
 * 3. Two occupants starting at the same XZ retain their distinct floor assignments
 *    while one crosses the bridge and a third rides the lift.
 * 4. One coaster carries an enacted rider through a banked lap. The same course
 *    and boarding producer moves a rail carriage between two platforms.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the scenario and the stage, motion and topographic facts it pins.
 * @evidence contracts/development/testing.md#behavioral-verification Compiles the same authored configuration served by the native capture module. Observes the returned scene support, prop channels, frame targets and closing performer placement.
 * @evidence contracts/development/testing.md#independent-expectations The expected grade, quarter-turn, occupied floor levels, course endpoints and rail station positions follow from dimensions and schedules in the authored examples.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks ground away from the pad, walkway, threshold and interior rather than only a seed snapshot, and distinguishes the opening leaf from the static shell and furnishings.
 * @evidence contracts/development/testing.md#execution-ownership Runs CPU compiles through the normal engine API. The separate capture subjects use these same authored values in the browser.
 */
export function test_environment_production(): void {
  const input: compileEnvironmentExample.IInput = hillsideStop();
  const compiled: compileEnvironmentExample.IOutput =
    compileEnvironmentExample(input);
  const threshold: IAutoMovieVector3 =
    input.environment.anchors["station/ground/entry"]!.translation;
  const space: NonNullable<typeof compiled.shot.source.scene.space> =
    compiled.shot.source.scene.space!;
  TestValidator.predicate(
    "sill, graded approach and floor meet at the declared station height",
    vclose(threshold, { x: 3, y: 1.3, z: 0 }, 0.001) &&
      [
        AutoMovieEngineWorld.groundHeight(
          input.environment.runtime.world.surfaces,
          {
            x: 3,
            z: -2,
          },
        ),
        AutoMovieEngineSpace.heightAt(space, 3, -0.2),
        AutoMovieEngineSpace.heightAt(space, 3, 0),
        AutoMovieEngineSpace.heightAt(space, 3, 1.5),
      ].every(
        (height: number | null): boolean =>
          height !== null && nclose(height, 1.3, 0.005),
      ) &&
      nclose(AutoMovieEngineSpace.heightAt(space, -8, -4)!, 0.2, 0.005),
  );
  const visitor:
    | (typeof compiled.shot.continuity.closing.actors)[number]
    | undefined = compiled.shot.continuity.closing.actors.find(
    (actor) => actor.node === "visitor",
  );
  TestValidator.predicate(
    "the visitor crosses into the hall",
    visitor !== undefined &&
      vclose(visitor.transform.translation, { x: 3, y: 1.3, z: 2.5 }, 0.025),
  );
  let refused: unknown = null;
  try {
    compileEnvironmentExample({
      ...input,
      actors: input.actors.map(
        (actor: IAutoMovieStageActor): IAutoMovieStageActor =>
          actor.node === "visitor"
            ? { ...actor, support: [{ from: 0, surfaces: space.walkable }] }
            : actor,
      ),
      actions: input.actions
        .filter(
          (action) => action.actor !== "visitor" || action.verb !== "hold",
        )
        .map((action) =>
          action.actor === "visitor" ? { ...action, start: 0 } : action,
        ),
    });
  } catch (error) {
    refused = error;
  }
  TestValidator.predicate(
    "the same route is refused while the threshold is unavailable, even when cited",
    refused instanceof Error &&
      refused.message.includes("eligible support footprint") &&
      refused.message.includes("visitor"),
  );
  const motion: typeof compiled.shot.source.shot.objectMotions =
    compiled.shot.source.shot.objectMotions;
  const door: string = "hill/station/ground/entry";
  const channel: string = `node:${door}:rotation`;
  const before: number[] = AutoMovieEngineSequence.sampleClipSequence(motion, 0.65).get(channel)!.value;
  const after: number[] = AutoMovieEngineSequence.sampleClipSequence(motion, 6.65).get(channel)!.value;
  const alignment: number = Math.abs(
    before.reduce(
      (sum: number, component: number, index: number): number =>
        sum + component * after[index]!,
      0,
    ),
  );
  const handle: IAutoMovieVector3 = input.environment.runtime.props
    .find((prop) => prop.node === door)!
    .model.affordances!.find((affordance) => affordance.id === "pull")!.frame
    .translation;
  const stagedLeaf: IAutoMovieTransform = compiled.shot.source.scene.nodes.find(
    (node) => node.id === door,
  )!.transform;
  const body: IAutoMovieMotionHumanBody = AutoMovieMotionHumanBody.create(
    compiled.body.skeleton,
    compiled.body.profile,
  );
  const readHand: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    new Set(["rightHand"]),
  );
  const wrists: IAutoMovieVector3[] = [1, 3 + 16 / 24, 5.75, 6.625].map(
    (time: number): IAutoMovieVector3 => {
      const pose: IAutoMoviePose = actorPose(compiled, "opener", time);
      const wrist = readHand(pose).get("rightHand")!.worldPosition;
      const turn = AutoMovieEngineSequence.sampleClipSequence(motion, time).get(channel)!.value;
      return Quaternion.rotateVector(
        Quaternion.inverse({
          x: turn[0]!,
          y: turn[1]!,
          z: turn[2]!,
          w: turn[3]!,
        }),
        Vector3.subtract(wrist, stagedLeaf.translation),
      );
    },
  );
  TestValidator.predicate(
    "the compiled wrist holds within 5 mm of its first grip throughout the leaf's turn",
    nclose(alignment, Math.SQRT1_2, 0.001) &&
      Vector3.length(Vector3.subtract(wrists[0]!, handle)) < 0.1 &&
      wrists.every(
        (wrist: IAutoMovieVector3): boolean =>
          Vector3.length(Vector3.subtract(wrist, wrists[0]!)) < 0.005,
      ),
  );
  const through: IAutoMoviePose = actorPose(compiled, "visitor", 9.8);
  const opening = space.surfaces.find(
    (surface) => surface.id === `${door}/threshold`,
  )!;
  const jambs: number[] = opening.polygon.map(
    (corner: IAutoMovieVector3): number => corner.x,
  );
  const arms = poseBones(
    body,
    through,
    undefined,
    new Set([
      "leftUpperArm",
      "leftLowerArm",
      "leftHand",
      "leftMiddleDistal",
      "rightUpperArm",
      "rightLowerArm",
      "rightHand",
      "rightMiddleDistal",
    ]),
  );
  TestValidator.predicate(
    "the visitor walks through the jamb with both arms lowered inside the clear width",
    Math.abs(through.root!.translation.z) <= 0.075 &&
      [...arms.values()].every(
        ({ worldPosition }): boolean =>
          worldPosition.x - Math.min(...jambs) >= 0.03 &&
          Math.max(...jambs) - worldPosition.x >= 0.03,
      ) &&
      arms.get("leftUpperArm")!.worldPosition.y -
        arms.get("leftHand")!.worldPosition.y >
        0.15 &&
      arms.get("rightUpperArm")!.worldPosition.y -
        arms.get("rightHand")!.worldPosition.y >
        0.15,
  );

  const trail: compileEnvironmentExample.IInput = pondTrail();
  const trailShot: compileEnvironmentExample.IOutput =
    compileEnvironmentExample(trail);
  const trailSpace: NonNullable<typeof trailShot.shot.source.scene.space> =
    trailShot.shot.source.scene.space!;
  const wetlands: number | null = AutoMovieEngineWorld.groundHeight(
    trail.environment.runtime.world.surfaces,
    { x: 11, z: 10 },
  );
  const endFeet = poseBones(
    body,
    actorPose(trailShot, "walker", trail.seconds),
  );
  const endpoint: IAutoMovieVector3 = Vector3.scale(
    Vector3.add(
      endFeet.get("leftFoot")!.worldPosition,
      endFeet.get("rightFoot")!.worldPosition,
    ),
    0.5,
  );
  TestValidator.predicate(
    "dry trail and pond retain distinct support through the compiled scene",
    wetlands === 0 &&
      AutoMovieEngineSpace.heightAt(trailSpace, 11, 10) === null &&
      nclose(AutoMovieEngineSpace.heightAt(trailSpace, 11, 5)!, 0, 0.001) &&
      nclose(endpoint.x, 17, 0.005) &&
      nclose(endpoint.z, 5, 0.005) &&
      (["left", "right"] as const).every((side): boolean =>
        HumanFoot.sockets(body, endFeet, side).every(({ point }): boolean =>
          nclose(point.y, 0, 0.005),
        ),
      ),
  );
  TestValidator.predicate(
    "a supplied mesh keeps its named placement beside a compact population",
    vclose(
      trail.environment.anchors["marker/summit"]!.translation,
      { x: 18, y: 1.3, z: 5 },
      0.001,
    ) &&
      trail.environment.runtime.world.instanceSets?.length === 1 &&
      trail.environment.runtime.world.instanceSets[0]?.count === 24 &&
      trailShot.shot.source.scene.nodes.length === 3 &&
      trail.environment.builtEnvironments.length === 0,
  );
  const gait = poseBones(
    body,
    actorPose(trailShot, "walker", 3),
    undefined,
    new Set(["leftUpperArm", "leftHand", "rightUpperArm", "rightHand"]),
  );
  TestValidator.predicate(
    "the nonzero-facing trail walk keeps both hands below their shoulders",
    gait.get("leftUpperArm")!.worldPosition.y -
      gait.get("leftHand")!.worldPosition.y >
      0.15 &&
      gait.get("rightUpperArm")!.worldPosition.y -
        gait.get("rightHand")!.worldPosition.y >
        0.15,
  );

  const campus: compileEnvironmentExample.IInput = bridgeCampus();
  const bridge: compileEnvironmentExample.IOutput =
    compileEnvironmentExample(campus);
  const floors = bridge.shot.continuity.closing.actors;
  const getFloor = (node: string): IAutoMovieVector3 =>
    floors.find((actor) => actor.node === node)!.transform.translation;
  const cab = (time: number): IAutoMovieVector3 =>
    AutoMovieEngineFilm.bakedTransformFromClipsAt(
      bridge.shot.source.shot.objectMotions,
      "campus/lift/cab",
      time,
    )!.translation;
  TestValidator.predicate(
    "the same starting plan point feeds separate levels and the upper route crosses the span",
    vclose(campus.actors[0]!.position, { x: 4, y: 0, z: 4 }, 0.001) &&
      vclose(campus.actors[1]!.position, { x: 4, y: 3.4, z: 4 }, 0.001) &&
      vclose(getFloor("resident"), { x: 4, y: 0, z: 6 }, 0.03) &&
      vclose(getFloor("traveller"), { x: 15, y: 3.4, z: 4 }, 0.03) &&
      nclose(AutoMovieEngineSpace.heightAt(bridge.shot.source.scene.space!, 9.5, 4)!, 3.4, 0.001),
  );
  // The cab is docked at the upper stop from the schedule's first key there.
  const docked: number = environmentLiftSchedule.find(
    (key: (typeof environmentLiftSchedule)[number]): boolean =>
      key.stop === "upper",
  )!.seconds;
  TestValidator.predicate(
    "the staged cab rises to the next level and the transfer finishes on its landing",
    nclose(cab(docked).y - cab(0.2).y, 3.4, 0.001) &&
      vclose(getFloor("lift-rider"), { x: 15.32, y: 3.4, z: -1.06 }, 0.14) &&
      campus.environment.anchors["garden/amenities/seat"] !== undefined,
  );

  const parkInput: compileEnvironmentExample.IInput = bankedParkRide();
  const park: compileEnvironmentExample.IOutput =
    compileEnvironmentExample(parkInput);
  const coaster = (time: number): IAutoMovieVector3 =>
    AutoMovieEngineFilm.bakedTransformFromClipsAt(
      park.shot.source.shot.objectMotions,
      "park/coaster/carrier",
      time,
    )!.translation;
  TestValidator.predicate(
    "the occupied ride leaves and returns to the same station during its shot",
    vclose(coaster(1), { x: 4, y: 0, z: -7 }, 0.01) &&
      coaster(7).y > 1 &&
      vclose(coaster(14), { x: 4, y: 0, z: -7 }, 0.01) &&
      vclose(
        parkInput.environment.anchors["terrain/paths/approach/end"]!
          .translation,
        { x: 6.08, y: 0.38, z: -6.84 },
        0.005,
      ) &&
      parkInput.environment.anchors["concession/table-1/stack"] !== undefined &&
      park.shot.source.shot.performances.some(
        (performance) =>
          performance.node === "passenger" && performance.motion !== null,
      ),
  );

  const trainInput: compileEnvironmentExample.IInput = railShuttle();
  const train: compileEnvironmentExample.IOutput =
    compileEnvironmentExample(trainInput);
  const rider: string = trainInput.actors[0]!.node;
  const coach = (time: number): IAutoMovieVector3 =>
    AutoMovieEngineFilm.bakedTransformFromClipsAt(
      train.shot.source.shot.objectMotions,
      "rail/shuttle/carrier",
      time,
    )!.translation;
  TestValidator.predicate(
    "the same course producer carries the boarded commuter to a distinct platform",
    vclose(coach(0.5), { x: 0, y: -1.016, z: 12 }, 0.01) &&
      vclose(coach(8), { x: 0, y: -1.016, z: 23.7 }, 0.01) &&
      vclose(coach(17.75), { x: 0, y: -1.016, z: 38 }, 0.01) &&
      vclose(
        actorPose(train, rider, 8).root!.translation,
        { x: 0, y: 0, z: 23.7 },
        0.03,
      ) &&
      vclose(
        actorPose(train, rider, 17.75).root!.translation,
        { x: 1.65, y: 0, z: 38 },
        0.03,
      ),
  );
}

/** Read one enacted performer at the compiler's shot time in the scene frame. */
function actorPose(
  compiled: compileEnvironmentExample.IOutput,
  actor: string,
  time: number,
): IAutoMoviePose {
  const placement: IAutoMovieTransform = compiled.shot.source.scene.nodes.find(
    (node) => node.id === actor,
  )!.transform;
  const performance = compiled.shot.source.shot.performances.find(
    (record) => record.node === actor,
  )!;
  const clip: IAutoMovieMotion = compiled.shot.source.motions.find(
    (motion) => motion.id === performance.motion,
  )!;
  const pose: IAutoMoviePose = AutoMovieEngineMotionSampling.sampleMotion(
    clip,
    time - performance.startOffset,
  ).pose;
  if (pose.root === null) return { ...pose, root: placement };
  return {
    ...pose,
    root: {
      translation: Vector3.add(
        placement.translation,
        Quaternion.rotateVector(placement.rotation, pose.root.translation),
      ),
      rotation: Quaternion.multiply(placement.rotation, pose.root.rotation),
      scale: pose.root.scale,
    },
  };
}
