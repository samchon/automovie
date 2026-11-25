import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal, embraceFromBehind, headRest, lungeGrab, stand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * The partner-touch laws admit their partner before any body is moved: a
 * performer rests a head on or embraces another performer, so naming oneself is
 * refused on `partner` by `headRest` and `embraceFromBehind`; `lungeGrab`
 * closes at most its longest lunge, so a partner farther than the arms and that
 * lunge is refused on `partner`.
 *
 * Scenarios, the average man `a` at the origin: naming himself as the partner
 * of `headRest` and of `embraceFromBehind`, and lunging at `b` standing 3 m
 * away, are each refused on `partner`.
 *
 * The body is built whole (`humanFixtureBody`) for the contexts' entry.
 */
export async function test_unit_motions_touch_partner_touch(): Promise<void> {
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
        headRest.plan(
          motionActionContext(body, {
            partner: "a",
            region: "shoulderRight",
            hold: 1,
          }),
        ),
      ),
      axis(() =>
        embraceFromBehind.plan(
          motionActionContext(body, { partner: "a", hold: 1 }),
        ),
      ),
      axis(() =>
        lungeGrab.plan(
          motionActionContext(
            body,
            { partner: "b", region: "upperArmLeft" },
            {
              partners: [
                {
                  subject: "b",
                  body,
                  plan: stand.plan(
                    motionActionContext(
                      body,
                      { hold: 4, sway: 0 },
                      { subject: "b", at: { x: 0, y: 0, z: 3 }, yaw: 180 },
                    ),
                  ),
                },
              ],
            },
          ),
        ),
      ),
    ],
    ["partner", "partner", "partner"],
  );
}
