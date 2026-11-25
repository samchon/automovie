import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import {
  HumanRefusal,
  coatPartner,
  dressPartner,
  placeOverHead,
  slipRing,
  tipHat,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * The partner-dressing laws admit their partner before any arm is moved: a
 * dresser names another performer, so naming oneself is refused on `partner` by
 * `coatPartner`, `dressPartner`, `placeOverHead` and `slipRing`; `tipHat` tips
 * a worn hat with a free hand, so a hand that holds something is refused on
 * `hand`.
 *
 * Scenarios, the average man `a` at the origin:
 *
 * 1. Coating, dressing a wrist, placing a loop over the head and slipping a ring,
 *    each with `a` as the partner: refused on `partner`.
 * 2. Tipping the hat with a right hand that holds a cup: refused on `hand`.
 *
 * The body is built whole (`humanFixtureBody`) for the contexts' entry.
 */
export async function test_unit_motions_dressing_partner_dressing(): Promise<void> {
  // The contexts' entry reads the whole body's stance.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const axis = (plan: () => unknown): string | undefined => {
    try {
      plan();
      return undefined;
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : undefined;
    }
  };
  TestValidator.equals(
    "the refusals",
    [
      axis(() =>
        coatPartner.plan(
          motionActionContext(body, { prop: "coat", partner: "a", hold: 1 }),
        ),
      ),
      axis(() =>
        dressPartner.plan(
          motionActionContext(body, {
            prop: "watch",
            partner: "a",
            region: "wristLeft",
          }),
        ),
      ),
      axis(() =>
        placeOverHead.plan(
          motionActionContext(body, { prop: "loop", partner: "a" }),
        ),
      ),
      axis(() =>
        slipRing.plan(
          motionActionContext(body, {
            prop: "ring",
            partner: "a",
            hand: "left",
            side: "right",
          }),
        ),
      ),
      axis(() =>
        tipHat.plan(
          motionActionContext(
            body,
            { prop: "hat" },
            { holds: { right: "cup" } },
          ),
        ),
      ),
    ],
    ["partner", "partner", "partner", "partner", "hand"],
  );
}
