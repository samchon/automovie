import { ArchetypeFrame } from "@automovie/archetypes";
import { Vector3, physicalShapePairDistance } from "@automovie/engine";
import {
  AutoMovieMotionHumanAuditTangle,
  HumanColliders,
  StrikingBody,
} from "@automovie/motions";
import { strict as assert } from "node:assert";

import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import { SCENES } from "../src/scenes/SCENES";
import { SceneTake } from "../src/scenes/SceneTake";
import { SceneArchetype } from "../src/scenes/package/SceneArchetype";

/** Verify the two-handed steady camera during the original Tourists photograph. */
export function checkTourists(): void {
  const scene = SCENES.find(({ id }) => id === "tourists")!;
  for (const take of [scene.takes[0]!, scene.takes[2]!]) {
    const input = SceneTake.apply(scene.composition!, take);
    const { performance } = PlaygroundPerformance.build(input);
    const photo = performance
      .segments("ivy")
      .find(({ name }) => name === "photograph")!;
    const support = photo.plan.contacts.find(
      ({ part, support }) =>
        part === "leftHand" &&
        support.kind === "prop" &&
        support.subject === "camera",
    )!;
    assert(support.to > support.from, take.label);
    const tool = SceneArchetype.model(
      input.objects!.find(({ subject }) => subject === "camera")!,
    );
    for (const share of [
      support.from,
      (support.from + support.to) / 2,
      support.to,
    ]) {
      const at = photo.start + photo.plan.duration * share;
      const frame = performance.prop("camera", at);
      const screen = ArchetypeFrame.compose(
        {
          translation: frame.position,
          rotation: frame.rotation,
          scale: { x: 1, y: 1, z: 1 },
        },
        tool.affordance("screen").frame,
      ).translation;
      const body = photo.context.body;
      const bones = performance.bones("ivy", at);
      assert(
        Vector3.distance(
          StrikingBody.region(body, bones, "noseBridge").point,
          screen,
        ) <= 0.01,
      );
      const left = HumanColliders.placed(body, bones).filter(({ bone }) =>
        /^left(Hand|Thumb|Index|Middle|Ring|Little)/.test(bone),
      );
      assert(left.length > 0);
      const shell = tool.shapes();
      assert(
        Math.min(
          ...left.flatMap(({ pose, shapes }) =>
            shapes.flatMap((shape) =>
              shell.map((part) =>
                physicalShapePairDistance(pose, shape, frame, part),
              ),
            ),
          ),
        ) <= 0.01,
      );
      for (const pair of AutoMovieMotionHumanAuditTangle.pose(body, bones))
        if (pair.a === "head" || pair.b === "head")
          assert(pair.depth <= 0.01, take.label + " " + pair.a + " " + pair.b);
    }
  }
}
