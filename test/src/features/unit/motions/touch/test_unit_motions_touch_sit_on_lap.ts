import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanRefusal,
  poseBones,
  resolveHumanPosture,
  sitOnLap,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * How near a touching part comes to the touched skin, metres: a hand's length
 * from the wrist joint to the palm, or 20 mm of skin and tolerance for a
 * surface on a surface (`HumanSignature.CONTACT`).
 */
const CONTACT: number = 0.02;
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
  const read = (
    plan: IAutoMovieMotionHumanActionPlan,
    seconds: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    poseBones(body, resolveHumanPosture(body, plan.posture(seconds)));
  const ready = (plan: IAutoMovieMotionHumanActionPlan): number =>
    plan.duration *
    plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === "ready")!
      .share;
  const surface = (
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    region: AutoMovieHumanoidRegion,
  ): IAutoMovieVector3 => {
    const frame = body.surfaces.regions[region];
    return resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!)
      .point;
  };
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
