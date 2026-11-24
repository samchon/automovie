import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGrapple,
} from "@automovie/interface";
import { grapple, grappleStances, stand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * `grapple.plan` plays one role of a scripted grappling scene on the scene's
 * shared clock: its length the kind's default (`grappleStances.seconds`), the
 * grip taken and released at the kind's window shares, and the initiator's
 * hands gripping the receiver's regions over that window.
 *
 * Two average men stand `grapple.spacing` apart, facing each other.
 *
 * Scenarios:
 *
 * 1. The thrown receiver of a shoulder throw lasts 3.5 s, its grip at 15.5% and
 *    its release at the shoulder entry, and ends lying.
 * 2. The Greco-Roman initiator lasts 3.8 s and grips the receiver's shoulders,
 *    crossed, from 17% to 37%.
 * 3. A partner who is the performer, or a non-positive duration, is refused.
 */
export async function test_unit_motions_grappling_grapple_plan(): Promise<void> {
  // Whole body: the floor solver moves each actor through its supports over the
  // full rig, and the initiator's hands are coursed on the receiver.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const standing: IAutoMovieMotionHumanActionPlan = stand.plan(
    motionActionContext(body, { hold: 10 }),
  );
  const role = (
    params: IAutoMovieMotionHumanGrapple.IParams,
    partner?: IAutoMovieMotionHumanActionPlan,
  ): IAutoMovieMotionHumanActionPlan =>
    grapple.plan(
      motionActionContext(body, params, {
        subject: params.role === "initiator" ? "a" : "b",
        ...(params.role === "initiator"
          ? {}
          : {
              at: { x: 0, y: 0, z: grapple.spacing(params.kind, body, body) },
              yaw: 180,
            }),
        partners: [
          {
            subject: params.partner,
            body,
            plan: partner ?? standing,
          },
        ],
      }),
    );
  const share = (p: IAutoMovieMotionHumanActionPlan, name: string): number =>
    p.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share;

  // 1. The thrown receiver.
  const thrown: IAutoMovieMotionHumanActionPlan = role({
    kind: "seoiNage",
    role: "receiver",
    partner: "a",
  });
  TestValidator.predicate(
    "the receiver's clock and ending",
    nclose(thrown.duration, grappleStances.seconds("seoiNage"), 1e-9) &&
      nclose(share(thrown, "grip"), 0.155, 1e-12) &&
      nclose(share(thrown, "release"), grappleStances.SHOULDER_ENTRY, 1e-12) &&
      thrown.base?.kind === "lying",
  );

  // 2. The Greco-Roman initiator.
  const receiver: IAutoMovieMotionHumanActionPlan = role({
    kind: "grecoRoman",
    role: "receiver",
    partner: "a",
  });
  const lifting: IAutoMovieMotionHumanActionPlan = role(
    { kind: "grecoRoman", role: "initiator", partner: "b" },
    receiver,
  );
  const grips: IAutoMovieMotionHumanContactWindow[] = lifting.contacts.filter(
    (w: IAutoMovieMotionHumanContactWindow): boolean => w.kind === "grip",
  );
  const grip = (
    side: "left" | "right",
    region: AutoMovieHumanoidRegion,
  ): IAutoMovieMotionHumanContactWindow => ({
    part: `${side}Hand`,
    kind: "grip",
    from: 0.17,
    to: 0.37,
    support: { kind: "person", subject: "b", region },
  });
  TestValidator.equals("the shoulders gripped over the window", grips, [
    grip("left", "shoulderRight"),
    grip("right", "shoulderLeft"),
  ]);
  TestValidator.predicate(
    "the initiator's clock",
    nclose(lifting.duration, grappleStances.seconds("grecoRoman"), 1e-9),
  );

  // 3. Refusals.
  TestValidator.predicate(
    "oneself, or no time",
    throwsError(() =>
      grapple.plan(
        motionActionContext(body, {
          kind: "seoiNage",
          role: "receiver",
          partner: "a",
        }),
      ),
    ) &&
      throwsError(() =>
        role({ kind: "seoiNage", role: "receiver", partner: "a", duration: 0 }),
      ),
  );
}
