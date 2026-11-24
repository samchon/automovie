import { handshakeOffer } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** The bisection's resolution on the turn, degrees: well under its 2^-50. */
const RESOLUTION: number = 1e-9;

/**
 * `handshakeOffer.shape` takes a difference in elbow height by turning both
 * forearms one angle `t`, the higher down and the lower up, so the palms meet:
 * `h sin(s + t) - l sin(s - t) = drop`, `s` the offering slope of `90 - 30 - 45
 * = 15` degrees; the higher upper arm lowers only when its palm would leave its
 * reach at the bottom of the pump.
 *
 * Scenarios, 0.3 m upper arms and forearms:
 *
 * 1. No drop: no turn and no lowering.
 * 2. A 0.05 m drop with no pump: `0.6 cos 15 sin t = 0.05`, so `t = asin(0.05 /
 *    (0.6 cos 15))`, about 4.95 degrees, the higher palm within reach, so no
 *    lowering.
 * 3. A 0.4 m drop: the turn would carry the higher palm out of reach, so its upper
 *    arm lowers, by more than nothing and at most the offering 30 degrees.
 */
export function test_unit_motions_handling_handshake_offer_shape(): void {
  TestValidator.equals(
    "equal partners",
    handshakeOffer.shape(0.3, 0.3, 0.3, 0, 0),
    { lowered: 0, turn: 0 },
  );
  const slope: number = (15 * Math.PI) / 180;
  const dropped: handshakeOffer.IShape = handshakeOffer.shape(
    0.3,
    0.3,
    0.3,
    0.05,
    0,
  );
  TestValidator.predicate(
    "a small drop",
    dropped.lowered === 0 &&
      nclose(
        dropped.turn,
        (Math.asin(0.05 / (0.6 * Math.cos(slope))) * 180) / Math.PI,
        RESOLUTION,
      ),
  );
  const deep: handshakeOffer.IShape = handshakeOffer.shape(
    0.3,
    0.3,
    0.3,
    0.4,
    0,
  );
  TestValidator.predicate(
    "a deep drop",
    deep.lowered > 0 && deep.lowered <= 30,
  );
}
