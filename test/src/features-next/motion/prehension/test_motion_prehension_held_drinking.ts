import { createDrinkware } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";

/**
 * A glass picked up for drinking must remain attached at its grip and bring its own rim to the lips.
 *
 * Scenarios:
 * 1. At grip closure read the glass transform in the right wrist's frame.
 * 2. At the drinking contact transform the glass's lip affordance and the head's mouth site independently.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A glass picked up for drinking must remain attached at its grip and bring its own rim to the lips.
 * @evidence contracts/development/testing.md#independent-expectations A rigid grip preserves its hand-local transform between the two events. The two authored contact sites must meet within the 10 mm skin allowance.
 * @evidence contracts/development/testing.md#distinguishing-cases At grip closure read the glass transform in the right wrist's frame. At the drinking contact transform the glass's lip affordance and the head's mouth site independently.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_prehension_held_drinking(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const model: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "glass",
  });
  const prop: IAutoMovieMotionHumanProp = HumanObject.prop("glass", model, {
    at: {
      x: -body.measure.shoulderHalfWidth,
      y: body.measure.waistHeight,
      z: 0.6 * (body.measure.upperArm + body.measure.forearm),
    },
    yaw: 0,
  });
  const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
    "signature",
    [{ subject: "a", body }],
    HumanChain.subject("a")
      .pickUp({
        prop: "glass",
        handle: "body",
        use: { tip: "lip", line: "square", at: "mouth" },
      })
      .handToFace({
        kind: "drink",
        prop: "glass",
        grasp: { handle: "body", line: "square" },
      }),
    [prop],
  );
  const grip: number = motionHumanLaw.event(film, "gripClosed");
  const meet: number = motionHumanLaw.event(film, "atMouth");
  TestValidator.predicate("pickup precedes drinking", grip < meet);
  const local = (seconds: number): IAutoMovieVector3 => {
    const hand: IAutoMovieResolvedBone = film
      .bones("a", seconds)
      .get("rightHand")!;
    return Quaternion.rotateVector(
      Quaternion.inverse(hand.worldRotation),
      Vector3.subtract(
        film.performance.prop("glass", seconds).position,
        hand.worldPosition,
      ),
    );
  };
  TestValidator.predicate(
    "the captured grasp survives the next action",
    Vector3.distance(local(grip), local(meet)) <= 0.001,
  );
  const lip: IAutoMovieAffordance = model.affordances!.find(
    (a) => a.id === "lip",
  )!;
  const glass: IAutoMovieRigidTransform = film.performance.prop("glass", meet);
  const rim: IAutoMovieVector3 = Vector3.add(
    glass.position,
    Quaternion.rotateVector(glass.rotation, lip.frame.translation),
  );
  const mouth: IAutoMovieHumanoidSurfaces.IFrame = body.surfaces.regions.mouth;
  const lips: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
    mouth,
    film.bones("a", meet).get(mouth.bone)!,
  ).point;
  TestValidator.predicate(
    "the mug's working rim meets the posed lips",
    Vector3.distance(rim, lips) <= 0.01,
  );
}
