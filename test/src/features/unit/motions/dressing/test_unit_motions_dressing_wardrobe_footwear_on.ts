import { createSeat, createStageFootwear } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSit,
  IAutoMovieMotionHumanWardrobe,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { pickUp, sit, wardrobe } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `wardrobe.plan` in its `footwearOn` mode puts a held shoe on one raised foot
 * while seated, with the opposite hand: the shoe ends worn on the foot, and the
 * hand's grip on it ends as it is worn.
 *
 * Scenario, the average man with a stage shoe (0.34 m long) taken in his left
 * hand from a stand at his left, seated on a 0.43 m office chair 0.25 m behind
 * the origin: putting it on the right foot declares the shoe worn on the right
 * foot at the share the left hand's grip on it ends.
 *
 * The body is built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_dressing_wardrobe_footwear_on(): Promise<void> {
  // Plans the seated lean, the raised leg and the arm on the whole body.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const shoe: IAutoMovieMotionHumanProp = HumanObject.prop(
    "footwear",
    createStageFootwear({
      id: "footwear",
      kind: "shoe",
      length: 0.34,
      width: 0.15,
      height: 0.045,
    }),
    { at: { x: 0.34, y: 0.73, z: 0.25 }, yaw: 0 },
  );
  const chair = createSeat({ kind: "office", seatHeight: 0.43 });
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(chair, {
    at: { x: 0, y: 0, z: -0.25 },
    yaw: 0,
  });
  const taken: IAutoMovieMotionHumanPickUp.IParams = {
    prop: "footwear",
    handle: "hold",
    hand: "left",
    lift: 0.04,
  };
  const held: IAutoMovieMotionHumanActionPlan = pickUp.plan(
    motionActionContext(body, taken, { props: [shoe] }),
  );
  const sitting: IAutoMovieMotionHumanSit.IParams = { seat, hold: 0.8 };
  const seated: IAutoMovieMotionHumanActionPlan = sit.plan(
    motionActionContext.after(body, held, sitting, {
      props: [shoe],
      holds: { left: "footwear" },
    }),
  );
  const params: IAutoMovieMotionHumanWardrobe = {
    kind: "footwearOn",
    prop: "footwear",
    side: "right",
    hand: "left",
  };
  const plan: IAutoMovieMotionHumanActionPlan = wardrobe.plan(
    motionActionContext.after(body, seated, params, {
      props: [shoe],
      holds: { left: "footwear" },
      supports: [
        { part: "seat", kind: "seat", support: { kind: "ground" } },
        { part: "leftFoot", kind: "plant", support: { kind: "ground" } },
        { part: "rightFoot", kind: "plant", support: { kind: "ground" } },
      ],
    }),
  );
  const worn = (plan.wears ?? []).find((w) => w.prop === "footwear");
  const grip = plan.contacts.find(
    (w) =>
      w.kind === "grip" &&
      w.part === "leftHand" &&
      w.support.kind === "prop" &&
      w.support.subject === "footwear",
  );
  TestValidator.predicate(
    "worn on the right foot as the grip lets go",
    worn !== undefined &&
      worn.bone === "rightFoot" &&
      grip !== undefined &&
      grip.to === worn.from,
  );
}
