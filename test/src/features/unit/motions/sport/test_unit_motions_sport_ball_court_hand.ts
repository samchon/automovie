import { ballCourtHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** The shoulder half width, the arm's length and the ball's radius, metres. */
const WIDTH: number = 0.2;
const ARM: number = 0.6;
const RADIUS: number = 0.12;

/**
 * `ballCourtHand` places a court phrase's hand in the performer's frame (+X
 * left) from the shoulders' midpoint, by the stroke's and the follow-through's
 * progress, in arm lengths.
 *
 * Scenarios:
 *
 * 1. A right-hand chest pass starts on the ball's side 0.2 arms below and 0.31
 *    ahead, palm toward the ball, and ends 0.84 arms ahead pushing forward.
 * 2. A bounce pass ends 0.47 arms below, aiming down.
 * 3. A contest's left hand at an eighth of the stroke is at its first wave's
 *    crest, 0.13 arms out.
 * 4. A set shot's left hand releases 0.85 arms up, the palm turned up.
 */
export function test_unit_motions_sport_ball_court_hand(): void {
  const at = (
    kind: ballCourtHand.Kind,
    side: "left" | "right",
    u: number,
    follow: number,
  ): ballCourtHand.ITarget =>
    ballCourtHand(kind, side, u, follow, WIDTH, ARM, RADIUS);
  const pass0: ballCourtHand.ITarget = at("chestPass", "right", 0, 0);
  const pass1: ballCourtHand.ITarget = at("chestPass", "right", 1, 1);
  TestValidator.predicate(
    "the chest pass",
    vclose(pass0.offset, { x: -RADIUS, y: -0.2 * ARM, z: 0.31 * ARM }, 1e-12) &&
      vclose(pass0.facing, { x: 1, y: 0, z: 0 }, 1e-12) &&
      vclose(
        pass1.offset,
        { x: -(RADIUS + 0.06 * ARM), y: -0.25 * ARM, z: 0.84 * ARM },
        1e-12,
      ) &&
      vclose(pass1.facing, { x: 1, y: 0, z: 1 }, 1e-12),
  );
  TestValidator.predicate(
    "the bounce pass aims down",
    vclose(
      at("bouncePass", "right", 1, 0).offset,
      {
        x: -RADIUS,
        y: -0.47 * ARM,
        z: 0.76 * ARM,
      },
      1e-12,
    ) &&
      vclose(
        at("bouncePass", "right", 1, 0).facing,
        { x: 1, y: -0.4, z: 1 },
        1e-12,
      ),
  );
  TestValidator.predicate(
    "the contest's wave crest",
    vclose(
      at("highHandContest", "left", 0.125, 0).offset,
      { x: WIDTH + 0.23 * ARM, y: 0.52 * ARM, z: 0.21 * ARM },
      1e-12,
    ),
  );
  TestValidator.predicate(
    "the set shot's release",
    vclose(
      at("setShot", "left", 1, 0).offset,
      {
        x: RADIUS,
        y: 0.85 * ARM,
        z: 0.42 * ARM,
      },
      1e-12,
    ) &&
      vclose(at("setShot", "left", 1, 0).facing, { x: 0, y: 1, z: 0.4 }, 1e-12),
  );
}
