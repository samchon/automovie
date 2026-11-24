import type {
  IAutoMovieMotionHumanAuditContact,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditContact,
  AutoMovieMotionHumanAuditGround,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { auditStanceMotion } from "../../../internal/auditStanceMotion";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/** Rounding of a few quotients, metres and metres per second. */
const ROUNDING: number = 1e-9;

/** How fast the body slides, metres per second: four times the rest speed. */
const SLIDE: number = 0.2;

/**
 * `AutoMovieMotionHumanAuditContact.measure` infers floor contact from the
 * displayed feet the way gait analysis does: a sole socket within `HEIGHT` of
 * the floor is on it, and at rest while its horizontal speed is under `SPEED`,
 * 50 mm/s (Ghoussayni et al. 2004). Outside every declared window a socket on
 * the floor that travels skates; inside a plant window the held contact's
 * horizontal speed is `loose` and its height `afloat`.
 *
 * Scenarios, the average man's quiet stance for 1 s at 4 Hz:
 *
 * 1. Sliding along +X at 0.2 m/s with no window declared, the feet skate at 0.2
 *    m/s in every step: share 1; nothing is loose.
 * 2. The same slide with both feet planted is loose at 0.2 m/s and skates not.
 * 3. Still and planted, raised 0.02 m, nothing skates or slips and the contact
 *    floats its quiet-stance height plus 0.02 m.
 *
 * The body is built whole (`humanFixtureBody`): the sole sockets are placed on
 * the body's displayed foot bones.
 */
export async function test_unit_motions_audit_auto_movie_motion_human_audit_contact_measure(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const slide = (t: number): IAutoMovieVector3 => ({
    x: SLIDE * t,
    y: 0,
    z: 0,
  });
  const skated: IAutoMovieMotionHumanAuditContact.IResult =
    AutoMovieMotionHumanAuditContact.measure(
      auditStanceMotion(body, { shift: slide }),
      "a",
      body,
      4,
    );
  TestValidator.predicate(
    "an undeclared slide",
    nclose(skated.skate.value, SLIDE, ROUNDING) &&
      skated.share === 1 &&
      skated.loose.value === 0,
  );
  const loose: IAutoMovieMotionHumanAuditContact.IResult =
    AutoMovieMotionHumanAuditContact.measure(
      auditStanceMotion(body, {
        shift: slide,
        contacts: auditStanceMotion.plants(),
      }),
      "a",
      body,
      4,
    );
  TestValidator.predicate(
    "a planted slide",
    nclose(loose.loose.value, SLIDE, ROUNDING) &&
      loose.loose.where === "stand leftFoot" &&
      loose.skate.value === 0 &&
      loose.share === 0,
  );
  const still: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
  );
  const quiet: number = Math.max(
    ...(["left", "right"] as const).map(
      (side: "left" | "right"): number =>
        AutoMovieMotionHumanAuditGround.held(body, still, side, undefined).point
          .y,
    ),
  );
  const raised: IAutoMovieMotionHumanAuditContact.IResult =
    AutoMovieMotionHumanAuditContact.measure(
      auditStanceMotion(body, {
        shift: () => ({ x: 0, y: 0.02, z: 0 }),
        contacts: auditStanceMotion.plants(),
      }),
      "a",
      body,
      4,
    );
  TestValidator.predicate(
    "raised and planted",
    raised.skate.value === 0 &&
      raised.loose.value === 0 &&
      nclose(raised.afloat.value, quiet + 0.02, 1e-6),
  );
}
