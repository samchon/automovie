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
 * 3. Planted on a deck travelling 1 m/s along +Z under a quarter-turned heading,
 *    and carried with it, nothing slips: only travel on the support counts; the
 *    same motion read without the deck's frame slips the deck's 1 m; feet
 *    travelling 10 % faster than the deck slip its 0.1 m.
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
  // A deck travelling 1 m/s along +Z under a quarter-turned heading, so a
  // reading that left the support's rotation out would not hold the foot.
  const deck = (t: number) => ({
    position: { x: 0, y: 0, z: t },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  });
  const onDeck = (speed: number): number =>
    AutoMovieMotionHumanAuditGround.slip(
      auditStanceMotion(body, {
        shift: (t: number) => ({ x: 0, y: 0, z: speed * t }),
        contacts: auditStanceMotion.plants({ kind: "prop", subject: "deck" }),
        support: (_support, t: number) => deck(t),
      }),
      "a",
      body,
      4,
    ).value;
  const unframed: number = AutoMovieMotionHumanAuditGround.slip(
    auditStanceMotion(body, {
      shift: (t: number) => ({ x: 0, y: 0, z: t }),
      contacts: auditStanceMotion.plants({ kind: "prop", subject: "deck" }),
    }),
    "a",
    body,
    4,
  ).value;
  TestValidator.predicate(
    "carried on a deck",
    nclose(onDeck(1), 0, ROUNDING) &&
      nclose(unframed, 1, ROUNDING) &&
      nclose(onDeck(1.1), 0.1, ROUNDING),
  );
}
