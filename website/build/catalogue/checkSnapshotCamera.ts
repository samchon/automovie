import {
  Quaternion,
  Vector3,
  physicalShapePairDistance,
} from "@automovie/engine";
import {
  AutoMovieMotionHumanAuditTangle,
  HumanColliders,
  poseBones,
} from "@automovie/motions";
import assert from "node:assert/strict";

import { PlaygroundPerformance } from "../../src/playground/package/PlaygroundPerformance";
import { SceneTake } from "../../src/scenes/SceneTake";
import { SCENES_GESTURES } from "../../src/scenes/data/SCENES_GESTURES";

/**
 * Read both hands at the exposure of the maintained Snapshot take. The
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
  const photo = performance.segments("fay")[1]!;
  assert.equal(photo.name, "photograph");
  const grip = photo.plan.contacts.find(
    (contact) =>
      contact.part === "leftHand" &&
      contact.kind === "grip" &&
      contact.support.kind === "prop" &&
      contact.support.subject === "camera",
  );
  const exposure = photo.plan.events.find(
    (event) => event.name === "strokeStart",
  )!.share;
  assert(
    grip !== undefined && grip.from === exposure && grip.to > exposure,
    "the support closes at exposure and persists through the hold",
  );
  const seconds = photo.start + exposure * photo.plan.duration;
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
  for (const side of ["left", "right"] as const) {
    const gap = Math.min(
      ...hands
        .filter((part) => part.bone.startsWith(side))
        .flatMap((part) =>
          part.shapes.flatMap((shape) =>
            camera.shapes!.map((other) =>
              physicalShapePairDistance(part.pose, shape, prop, other),
            ),
          ),
        ),
    );
    assert(
      Math.abs(gap) <= skin,
      `${side} hand closes on the camera within the contact skin`,
    );
  }
}
