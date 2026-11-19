import { Quaternion, Vector3, physicalShapePairDistance } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditTangle,
  HumanColliders,
  poseBones,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { PlaygroundPerformance } from "../../src/playground/package/PlaygroundPerformance";
import { SceneTake } from "../../src/scenes/SceneTake";
import { SCENES_GESTURES } from "../../src/scenes/data/SCENES_GESTURES";
import type { IScene } from "../../src/scenes/structures/IScene";

/**
 * The two authored photographer bodies both reach the viewfinder, close both
 * grips on the camera and keep their hands clear of each other. The authored
 * pickup and photo schedule runs through the website's performance builder.
 */
export function test_website_snapshot(): void {
  const scene: IScene = SCENES_GESTURES.find(
    (entry: IScene): boolean => entry.id === "snapshot",
  )!;
  const skin: number = AutoMovieMotionHumanAuditTangle.BUILT;
  for (const take of [scene.takes[0]!, scene.takes[2]!]) {
    const { performance } = PlaygroundPerformance.build(
      SceneTake.apply(scene.composition!, take),
    );
    const [, photo]: readonly IAutoMovieMotionHumanSegment[] =
      performance.segments("fay");
    if (photo?.name !== "photograph")
      throw new Error(`The ${take.label} take did not reach the photograph`);

    // Read the displayed frames on arrival, during exposure and at release.
    const grip = photo.plan.contacts.find(
      (contact): boolean =>
        contact.part === "leftHand" &&
        contact.kind === "grip" &&
        contact.support.kind === "prop" &&
        contact.support.subject === "camera",
    );
    if (grip === undefined || grip.from >= grip.to)
      throw new Error(`The ${take.label} take lacks the supporting grip`);
    const atEye = photo.plan.events.find((event): boolean => event.name === "atEye")!;
    const exposure = photo.plan.events.find((event): boolean => event.name === "strokeStart")!;
    const lower = photo.plan.events.find((event): boolean => event.name === "relax")!;
    TestValidator.predicate(
      `${take.label} presents, supports, exposes and releases in order`,
      atEye.share < grip.from &&
        grip.from === exposure.share &&
        grip.to < lower.share,
    );
    const camera = photo.context.prop("camera").prop;
    const screen: IAutoMovieVector3 = camera.affordances!.find(
      (affordance): boolean => affordance.id === "screen",
    )!.frame.translation;
    const body = photo.context.body;
    const nose = body.surfaces.regions.noseBridge;
    const fingers: RegExp = /^(left|right)(Hand|Thumb|Index|Middle|Ring|Little)/;
    for (const u of [grip.from, (grip.from + grip.to) / 2, grip.to]) {
      const seconds: number = photo.start + u * photo.plan.duration;
      const label: string = `${take.label} at ${seconds.toFixed(3)} s`;
      const bones: ReturnType<typeof poseBones> = poseBones(
        body,
        performance.pose("fay", seconds),
      );
      const head = bones.get(nose.bone)!;
      const prop: IAutoMovieRigidTransform = performance.prop("camera", seconds);
      const screenPoint: IAutoMovieVector3 = Vector3.add(
        prop.position,
        Quaternion.rotateVector(prop.rotation, screen),
      );
      const nosePoint: IAutoMovieVector3 = Vector3.add(
        head.worldPosition,
        Quaternion.rotateVector(head.worldRotation, nose.point),
      );
      TestValidator.predicate(
        `${label} presents the viewfinder at the nose bridge`,
        Vector3.distance(screenPoint, nosePoint) <= skin,
      );

      const parts: IAutoMovieMotionHumanColliders.IPlaced[] =
        HumanColliders.placed(body, bones).filter((part) =>
          fingers.test(part.bone),
        );
      const [left, right]: IAutoMovieMotionHumanColliders.IPlaced[][] = [
        "left",
        "right",
      ].map((side) => parts.filter((part) => part.bone.startsWith(side)));
      TestValidator.predicate(
        `${label} keeps both hands physically separate`,
        left!.length > 0 &&
          right!.length > 0 &&
          left!.every((a) =>
            right!.every((b) =>
              a.shapes.every((shape) =>
                b.shapes.every(
                  (other) =>
                    physicalShapePairDistance(a.pose, shape, b.pose, other) >= 0,
                ),
              ),
            ),
          ),
      );
      for (const hand of [left!, right!]) {
        const gap: number = Math.min(
          ...hand.flatMap((part) =>
            part.shapes.flatMap((shape) =>
              camera.shapes!.map((other) =>
                physicalShapePairDistance(part.pose, shape, prop, other),
              ),
            ),
          ),
        );
        TestValidator.predicate(
          `${label} keeps the camera within the grip's skin margin`,
          Math.abs(gap) <= skin,
        );
      }
    }
  }
}
