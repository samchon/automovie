import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditGround } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { auditStanceMotion } from "../../../internal/auditStanceMotion";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/** Rounding of a few sums, metres. */
const ROUNDING: number = 1e-9;

/** How fast the body slides, metres per second. */
const SLIDE: number = 0.2;

/**
 * `AutoMovieMotionHumanAuditGround.slip` reads the largest horizontal distance
 * a planted foot's contact travels from where it was first the contact in its
 * plant window, held in the frame of the window's support.
 *
 * Scenarios, the average man's quiet stance, both feet planted for 1 s:
 *
 * 1. Still, nothing slips.
 * 2. Sliding along +X at 0.2 m/s and sinking, each foot slips 0.2 m by 1 s; the
 *    left foot, read first, holds the worst; the sinking is not slip.
 * 3. Planted on a deck that carries the body along at the same speed, nothing
 *    slips: only travel on the support counts.
 *
 * The body is built whole (`humanFixtureBody`): the contact is the foot's
 * lowest sole socket on the displayed bones.
 */
export async function test_unit_motions_audit_auto_movie_motion_human_audit_ground_slip(): Promise<void> {
  // Reads the body's foot sole geometry (`HumanFoot.sockets`); the parameter is the whole body record, which has no stored or partial typed form without a cast.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const along = (t: number): IAutoMovieVector3 => ({
    x: SLIDE * t,
    y: -0.01 * t,
    z: 0,
  });
  TestValidator.predicate(
    "still",
    AutoMovieMotionHumanAuditGround.slip(
      auditStanceMotion(body, { contacts: auditStanceMotion.plants() }),
      "a",
      body,
      4,
    ).value === 0,
  );
  const slid: IAutoMovieMotionHumanAuditMeasure =
    AutoMovieMotionHumanAuditGround.slip(
      auditStanceMotion(body, {
        shift: along,
        contacts: auditStanceMotion.plants(),
      }),
      "a",
      body,
      4,
    );
  TestValidator.predicate(
    "sliding",
    nclose(slid.value, SLIDE, ROUNDING) &&
      slid.seconds === 1 &&
      slid.where === "stand leftFoot",
  );
  TestValidator.predicate(
    "carried on a deck",
    nclose(
      AutoMovieMotionHumanAuditGround.slip(
        auditStanceMotion(body, {
          shift: along,
          contacts: auditStanceMotion.plants({ kind: "prop", subject: "deck" }),
          support: (_support, t: number) => ({
            position: along(t),
            rotation: Quaternion.identity(),
          }),
        }),
        "a",
        body,
        4,
      ).value,
      0,
      ROUNDING,
    ),
  );
}
