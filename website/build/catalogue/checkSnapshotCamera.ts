import {
  Quaternion,
  Vector3,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanSegment,
  IAutoMoviePhysicalShape,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditTangle,
  HumanColliders,
  poseBones,
} from "@automovie/motions/internal";
import assert from "node:assert/strict";

import { PlaygroundPerformance } from "../../src/playground/package/PlaygroundPerformance";
import { SceneTake } from "../../src/scenes/SceneTake";
import { SCENES_GESTURES } from "../../src/scenes/data/SCENES_GESTURES";

/**
 * Read both hands during both photographs of the maintained Snapshot take. The
 * contact skin and the landmarks retain the physical checks from #3755.
 */
export function checkSnapshotCamera(): void {
  const scene = SCENES_GESTURES.find((entry) => entry.id === "snapshot")!;
  const composition = SceneTake.apply(scene.composition!, scene.takes[0]!);
  assert.equal(
    composition.objects!.find((object) => object.subject === "camera")!
      .producer,
    "createCamera",
    "Snapshot uses the named camera",
  );
  const { performance } = PlaygroundPerformance.build(composition);
  const photos = performance
    .segments("fay")
    .filter((segment) => segment.name === "photograph");
  assert.equal(photos.length, 2);
  for (const photo of photos) {
    const grip = photo.plan.contacts.find(
      (contact) =>
        contact.part === "leftHand" &&
        contact.kind === "grip" &&
        contact.support.kind === "prop" &&
        contact.support.subject === "camera",
    );
    const supported = photo.plan.events.find(
      (event) => event.name === "strokeStart",
    )!.share;
    const shutter = photo.plan.events.find(
      (event) => event.name === "stroke",
    )!.share;
    assert(
      grip !== undefined && grip.from === supported && grip.to > shutter,
      "the support closes before the shutter and persists through the hold",
    );
    for (const share of [supported, shutter, (grip.from + grip.to) / 2])
      checkGripAt(
        performance,
        photo,
        photo.start + share * photo.plan.duration,
      );
  }
}

/** Measure the named grip sites on the emitted camera and displayed hand surfaces. */
function checkGripAt(
  performance: ReturnType<typeof PlaygroundPerformance.build>["performance"],
  photo: IAutoMovieMotionHumanSegment,
  seconds: number,
): void {
  const camera = photo.context.prop("camera").prop;
  const prop = performance.prop("camera", seconds);
  const body = photo.context.body;
  const bones = poseBones(body, performance.pose("fay", seconds));
  const nose = body.surfaces.regions.noseBridge;
  const head = bones.get(nose.bone)!;
  const screen = camera.affordances!.find(
    (affordance) => affordance.id === "screen",
  )!.frame.translation;
  const skin = AutoMovieMotionHumanAuditTangle.BUILT;
  assert(
    Vector3.distance(
      Vector3.add(
        prop.position,
        Quaternion.rotateVector(prop.rotation, screen),
      ),
      Vector3.add(
        head.worldPosition,
        Quaternion.rotateVector(head.worldRotation, nose.point),
      ),
    ) <= skin,
    "the viewfinder reaches the nose bridge",
  );
  const fingers = /^(left|right)(Hand|Thumb|Index|Middle|Ring|Little)/;
  const hands = HumanColliders.placed(body, bones).filter((part) =>
    fingers.test(part.bone),
  );
  const rod = camera.shapes!.find((shape) => shape.id === "grip");
  const shell = camera.shapes!.find((shape) => shape.id === "body");
  assert(rod && shell?.kind === "box" && shell.transform);
  const half = shell.halfExtents;
  const centre = shell.transform.position;
  // The supporting hand meets the outer lower front corner of the case.
  const support: IAutoMoviePhysicalShape = {
    ...shell,
    transform: {
      ...shell.transform,
      position: {
        x: centre.x + (3 * half.x) / 4,
        y: centre.y - (3 * half.y) / 4,
        z: centre.z + half.z / 2,
      },
    },
    halfExtents: { x: half.x / 4, y: half.y / 4, z: half.z / 2 },
  };
  const gap = (
    side: "left" | "right",
    target: IAutoMoviePhysicalShape,
  ): number =>
    Math.min(
      ...hands
        .filter((part) => part.bone.startsWith(side))
        .flatMap((part) =>
          part.shapes.map((shape) =>
            AutoMovieEnginePhysics.physicalShapePairDistance(part.pose, shape, prop, target),
          ),
        ),
    );
  assert(
    Math.abs(gap("right", rod)) <= skin,
    "the right hand closes on the grip rod",
  );
  assert(
    Math.abs(gap("left", support)) <= skin,
    "the left hand braces the outer underside",
  );
  assert(
    gap("left", rod) > skin && gap("right", support) > skin,
    "both hands miss the opposite contact site",
  );
}
