import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanTouch,
} from "@automovie/interface";
import { touchEffectors, touchSide } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `touchSide` picks the touching hand: the one the author names; else the hand
 * whose arm lays on the region with the lesser strain, a hand that would touch
 * its own arm never chosen, the right on a tie within the strains' resolution.
 *
 * Scenarios, the average man standing at the origin, the fingertips touching:
 *
 * 1. With the left hand named, the left touches, whatever the region.
 * 2. The left forearm is touched by the right hand and the right forearm by the
 *    left: an arm cannot touch itself, whatever the other hand's strain.
 * 3. The sternum with the other hand on the left forearm is touched by the left
 *    hand: the right would leave the left hand on its own forearm.
 *
 * The body is built whole (`humanFixtureBody`): the choice solves each arm on
 * the body's rig and surfaces.
 */
export async function test_unit_motions_touch_touch_side(): Promise<void> {
  // Solves each arm on the whole body: the rig, the arm chains, the ranges and the surfaces.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const side = (params: IAutoMovieMotionHumanTouch.IParams) =>
    touchSide(
      motionActionContext<IAutoMovieMotionHumanTouch.IParams>(body, params),
      touchEffectors.TABLE.fingertips,
    );
  TestValidator.equals(
    "the chosen hands",
    [
      side({ target: { kind: "self", region: "forearmLeft" }, hand: "left" }),
      side({ target: { kind: "self", region: "forearmLeft" } }),
      side({ target: { kind: "self", region: "forearmRight" } }),
      side({
        target: { kind: "self", region: "sternum" },
        other: { kind: "self", region: "forearmLeft" },
      }),
    ],
    ["left", "right", "left", "left"],
  );
}
