import { handshakeOffer } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a square root, metres. */
const ROUNDING: number = 1e-12;

/**
 * `handshakeOffer.reach` is how far a palm lies from its shoulder with the
 * elbow flexed `EXTENDED` (15 degrees): the law of cosines over the two
 * segments, `sqrt(u^2 + l^2 + 2 u l cos 15)`.
 *
 * Scenarios: a 0.3 m upper arm and a 0.25 m forearm reach `sqrt(0.09 + 0.0625
 * + 0.15 cos 15)`; equal 0.3 m segments reach `0.6 cos 7.5`, the chord of a
 * half-angle.
 */
export function test_unit_motions_handling_handshake_offer_reach(): void {
  const cos15: number = Math.cos((15 * Math.PI) / 180);
  TestValidator.predicate(
    "the reaches",
    nclose(
      handshakeOffer.reach(0.3, 0.25),
      Math.sqrt(0.09 + 0.0625 + 0.15 * cos15),
      ROUNDING,
    ) &&
      nclose(
        handshakeOffer.reach(0.3, 0.3),
        0.6 * Math.cos((7.5 * Math.PI) / 180),
        ROUNDING,
      ),
  );
}