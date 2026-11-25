import { createStageJacket } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanWardrobe,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { HumanRefusal, wardrobe } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `wardrobe.plan` judges a mode's preconditions before any arm is moved: a
 * sleeve is threaded only on a jacket seated on the wearer, its `wear` contact
 * within 0.12 m of the collar point (the shoulders' midpoint less 0.085 m, plus
 * 0.1 m forward); the zip is worked only by a free hand.
 *
 * Scenarios, the average man standing at the origin facing +Z and a stage
 * jacket:
 *
 * 1. The jacket lying 1 m ahead on the floor: threading the right sleeve is
 *    refused on `prop`, the jacket not seated.
 * 2. The right hand holding the jacket: closing the zip with it is refused on
 *    `side`, the hand not free.
 *
 * The body is built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_dressing_wardrobe(): Promise<void> {
  // Reads the body's shoulders for the collar through the context of the whole body.
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
    { position: { x: 0, y: 0, z: 1 }, rotation: Quaternion.identity() },
  );
  const refusal = (
    params: IAutoMovieMotionHumanWardrobe,
    holds: motionActionContext.IOptions["holds"],
  ): HumanRefusal | undefined => {
    try {
      wardrobe.plan(
        motionActionContext(body, params, { props: [jacket], holds }),
      );
      return undefined;
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error : undefined;
    }
  };
  const unseated = refusal(
    { kind: "sleeveIn", prop: "jacket", side: "right" },
    {},
  );
  const busy = refusal(
    { kind: "closeZip", prop: "jacket", side: "right" },
    { right: "jacket" },
  );
  TestValidator.predicate(
    "the preconditions",
    unseated?.axis === "prop" && busy?.axis === "side",
  );
}
