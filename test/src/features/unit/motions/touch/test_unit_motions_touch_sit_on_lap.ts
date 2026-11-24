import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal, sitOnLap, stand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `sitOnLap.plan` sits on a seated partner's lap; a partner whose knees lie
 * well below the hips, standing, has no lap and is refused on `partner`, as is
 * naming oneself.
 *
 * Scenario, two average men, `b` standing 0.6 m ahead facing `a`: sitting on
 * `b`'s lap is refused as a base refusal on `partner`, and sitting on one's own
 * lap as a parameter refusal on `partner`.
 *
 * The bodies are built whole (`humanFixtureBody`).
 */ export async function test_unit_motions_touch_sit_on_lap(): Promise<void> {
  // Plans the reach on the whole body and reads the partner's displayed surfaces.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const partner = (z: number): motionActionContext.IPartner => ({
    subject: "b",
    body,
    plan: stand.plan(
      motionActionContext(
        body,
        { hold: 8, sway: 0 },
        { subject: "b", at: { x: 0, y: 0, z }, yaw: 180 },
      ),
    ),
  });
  const refusal = (subject: string): HumanRefusal | undefined => {
    try {
      sitOnLap.plan(
        motionActionContext(
          body,
          { partner: subject },
          {
            partners: [partner(0.6)],
          },
        ),
      );
      return undefined;
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error : undefined;
    }
  };
  const standing: HumanRefusal | undefined = refusal("b");
  const own: HumanRefusal | undefined = refusal("a");
  TestValidator.predicate(
    "no lap",
    standing?.kind === "base" &&
      standing.axis === "partner" &&
      own?.kind === "parameter" &&
      own.axis === "partner",
  );
}
