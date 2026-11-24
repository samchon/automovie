import { createStageJacket } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanWardrobe,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  poseBones,
  resolveHumanPosture,
  stand,
  wardrobe,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `wardrobe.plan` in its `closeZip` mode draws a worn jacket's zip up with one
 * hand: the hand grips the slider and carries it up its travel.
 *
 * Scenario, the average man standing at the origin facing +Z wearing a stage
 * jacket with 0.15 m of zip travel, seated where the wardrobe seats one (its
 * `wear` contact on the collar point 0.085 m below and 0.1 m ahead of the
 * shoulders' midpoint): closing the zip with the right hand declares the right
 * hand's grip on the jacket, over which the right wrist rises by more than half
 * the travel.
 *
 * The body is built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_dressing_wardrobe_close_zip(): Promise<void> {
  // Plans the threading arm on the whole body: the rig, the arm chains and the colliders.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const model = createStageJacket({
    id: "jacket",
    width: 0.39,
    depth: 0.3,
    sleeveWidth: 0.19,
    sleeveLength: 0.04,
    length: 0.48,
    zipTravel: 0.15,
  });
  const site = (id: string): IAutoMovieAffordance =>
    model.affordances.find((a: IAutoMovieAffordance): boolean => a.id === id)!;
  const bones = poseBones(
    body,
    resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
  );
  // The collar the wardrobe seats a jacket at: 0.085 m below and 0.1 m ahead of
  // the shoulders' midpoint, turned with the body (`wardrobe`'s collar).
  const collar: IAutoMovieVector3 = Vector3.add(
    Vector3.lerp(
      bones.get("leftUpperArm")!.worldPosition,
      bones.get("rightUpperArm")!.worldPosition,
      0.5,
    ),
    { x: 0, y: -0.085, z: 0.1 },
  );
  // The jacket seated there: its `wear` contact on the collar, unturned.
  const wear: IAutoMovieAffordance = site("wear");
  const rotation: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.inverse(wear.frame.rotation),
  );
  const frame: IAutoMovieRigidTransform = {
    position: Vector3.subtract(
      collar,
      Quaternion.rotateVector(rotation, wear.frame.translation),
    ),
    rotation,
  };
  const jacket: IAutoMovieMotionHumanProp = {
    ...HumanObject.prop("jacket", model, { ...frame, fixed: true }),
    motion: (): IAutoMovieRigidTransform => frame,
  };
  const params: IAutoMovieMotionHumanWardrobe = {
    kind: "closeZip",
    prop: "jacket",
    side: "right",
  };
  const plan: IAutoMovieMotionHumanActionPlan = wardrobe.plan(
    motionActionContext(body, params, { props: [jacket] }),
  );
  const grip = plan.contacts.find(
    (w) =>
      w.kind === "grip" &&
      w.part === "rightHand" &&
      w.support.kind === "prop" &&
      w.support.subject === "jacket",
  );
  const wrist = (share: number): IAutoMovieVector3 =>
    poseBones(
      body,
      resolveHumanPosture(body, plan.posture(share * plan.duration)),
    ).get("rightHand")!.worldPosition;
  TestValidator.predicate(
    "drawn up",
    grip !== undefined && wrist(grip.to).y - wrist(grip.from).y > 0.075,
  );
}
