import { createStageFootwear, createStageJacket } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanWardrobe,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { HumanRefusal, pickUp, wardrobe } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `wardrobe.plan` in its `jacketOn` mode carries a held open-front jacket onto
 * the body: the holding hand's grip carries it until the jacket is worn on the
 * chest, from which the plan declares it worn.
 *
 * Scenario, the average man standing at the origin facing +Z with a stage
 * jacket (0.39 m wide, 0.48 m long) picked up by its hold with the right hand
 * from 1.06 m ahead of his right side: putting it on declares the jacket worn
 * on the chest, at the very share the right hand's grip on it ends: custody
 * passes from the hand to the chest at one instant.
 *
 * The body is built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_dressing_wardrobe(): Promise<void> {
  // Plans both arms and the carried jacket on the whole body: the rig, the arm chains and the surfaces.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const jacket: IAutoMovieMotionHumanProp = HumanObject.prop(
    "jacket",
    createStageJacket({
      id: "jacket",
      width: 0.39,
      depth: 0.3,
      sleeveWidth: 0.19,
      sleeveLength: 0.04,
      length: 0.48,
      zipTravel: 0.15,
    }),
    { at: { x: -0.1, y: 1.06, z: 0.24 }, yaw: 0 },
  );
  const taken: IAutoMovieMotionHumanPickUp.IParams = {
    prop: "jacket",
    handle: "hold",
    hand: "right",
    lift: 0.02,
  };
  const lifted: IAutoMovieMotionHumanActionPlan = pickUp.plan(
    motionActionContext(body, taken, { props: [jacket] }),
  );
  const params: IAutoMovieMotionHumanWardrobe = {
    kind: "jacketOn",
    prop: "jacket",
    hand: "right",
  };
  const plan: IAutoMovieMotionHumanActionPlan = wardrobe.plan(
    motionActionContext.after(body, lifted, params, {
      props: [jacket],
      holds: { right: "jacket" },
    }),
  );
  const worn = (plan.wears ?? []).find(
    (w) => w.prop === "jacket" && w.bone === "chest",
  );
  const grip = plan.contacts.find(
    (w) =>
      w.kind === "grip" &&
      w.part === "rightHand" &&
      w.support.kind === "prop" &&
      w.support.subject === "jacket",
  );
  TestValidator.predicate(
    "worn on the chest as the grip lets go",
    worn !== undefined && grip !== undefined && grip.to === worn.from,
  );
  // A shoe held as a jacket declares no sleeve: refused on the opening.
  const shoe: IAutoMovieMotionHumanProp = HumanObject.prop(
    "shoe",
    createStageFootwear({
      id: "shoe",
      kind: "shoe",
      length: 0.34,
      width: 0.15,
      height: 0.045,
    }),
    { at: { x: -0.1, y: 1.06, z: 0.24 }, yaw: 0 },
  );
  let refused: boolean = false;
  try {
    wardrobe.plan(
      motionActionContext(
        body,
        { kind: "jacketOn", prop: "shoe", hand: "right" },
        { props: [shoe], holds: { right: "shoe" } },
      ),
    );
  } catch (error: unknown) {
    refused =
      error instanceof HumanRefusal &&
      error.axis === "opening" &&
      error.value === "leftSleeveOpening";
  }
  TestValidator.predicate("a shoe is no jacket", refused);
}
