import { Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStrike } from "@automovie/motions";
import {
  AutoMovieMotionHumanAuditTangle,
  HumanColliders,
} from "@automovie/motions/internal";
import { strict as assert } from "node:assert";

import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import type { IPlaygroundComposition } from "../src/playground/structures/IPlaygroundComposition";
import { SCENES } from "../src/scenes/SCENES";
import { SceneTake } from "../src/scenes/SceneTake";
import { SceneArchetype } from "../src/scenes/package/SceneArchetype";
import type { IScene } from "../src/scenes/structures/IScene";
import { sceneAffordanceFrame } from "./sceneAffordanceFrame";

/** The bound, metres, for the screen at the nose bridge, the support hand on the shell and the head's tangle depth. */
const TOUCH: number = 0.01;

/** The left hand's bones, whose colliders support the camera. */
const LEFT_HAND: RegExp = /^left(Hand|Thumb|Index|Middle|Ring|Little)/;

/**
 * Verify the two-handed steady camera during the original Tourists
 * photograph on the two published body combinations.
 *
 * Scenarios, at the left hand's support window's start, middle and end:
 * 1. The camera's screen is at the photographer's nose bridge.
 * 2. A left-hand collider touches the camera's shell.
 * 3. Nothing tangles with the head deeper than the bound.
 */
export function checkTourists(): void {
  const scene: IScene = SCENES.find(
    ({ id }: IScene): boolean => id === "tourists",
  )!;
  for (const take of [scene.takes[0]!, scene.takes[2]!]) {
    const input: IPlaygroundComposition = SceneTake.apply(
      scene.composition!,
      take,
    );
    const { performance }: PlaygroundPerformance.IBuilt =
      PlaygroundPerformance.build(input);
    const photo: IAutoMovieMotionHumanSegment = performance
      .segments("ivy")
      .find(
        ({ name }: IAutoMovieMotionHumanSegment): boolean =>
          name === "photograph",
      )!;
    const support: IAutoMovieMotionHumanContactWindow =
      photo.plan.contacts.find(
        ({ part, support }: IAutoMovieMotionHumanContactWindow): boolean =>
          part === "leftHand" &&
          support.kind === "prop" &&
          support.subject === "camera",
      )!;
    assert(support.to > support.from, take.label);
    const camera: SceneArchetype.Model = SceneArchetype.model(
      input.objects!.find(
        ({ subject }: IPlaygroundComposition.IObject): boolean =>
          subject === "camera",
      )!,
    );
    const shell: IAutoMoviePhysicalShape[] = camera.shapes();
    const body: IAutoMovieMotionHumanBody = photo.context.body;
    for (const share of [
      support.from,
      (support.from + support.to) / 2,
      support.to,
    ]) {
      const at: number = photo.start + photo.plan.duration * share;
      const frame: IAutoMovieRigidTransform = performance.prop("camera", at);
      const screen: IAutoMovieVector3 = sceneAffordanceFrame(
        performance,
        camera,
        "camera",
        "screen",
        at,
      ).pose.translation;
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        performance.bones("ivy", at);
      assert(
        Vector3.distance(
          AutoMovieMotionHumanStrike.StrikingBody.region(
            body,
            bones,
            "noseBridge",
          ).point,
          screen,
        ) <= TOUCH,
        take.label + " screen at the eye",
      );
      const left: IAutoMovieMotionHumanColliders.IPlaced[] =
        HumanColliders.placed(body, bones).filter(
          ({ bone }: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
            LEFT_HAND.test(bone),
        );
      assert(left.length > 0);
      const gaps: number[] = left.flatMap(
        ({ pose, shapes }: IAutoMovieMotionHumanColliders.IPlaced): number[] =>
          shapes.flatMap((shape: IAutoMoviePhysicalShape): number[] =>
            shell.map((part: IAutoMoviePhysicalShape): number =>
              AutoMovieEnginePhysics.physicalShapePairDistance(pose, shape, frame, part),
            ),
          ),
      );
      assert(Math.min(...gaps) <= TOUCH, take.label + " left hand on camera");
      for (const pair of AutoMovieMotionHumanAuditTangle.pose(body, bones))
        if (pair.a === "head" || pair.b === "head")
          assert(pair.depth <= TOUCH, take.label + " " + pair.a + " " + pair.b);
    }
  }
}
