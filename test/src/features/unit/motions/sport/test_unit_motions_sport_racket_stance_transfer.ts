import { racketStanceTransfer } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `racketStanceTransfer` moves a racket stance's weight between two feet over a
 * window: the first foot swings over 17% to 43% of it and the second over 57%
 * to 83%, and the pelvis shifts `SUPPORT_SHARE` (0.65) of the way to the first
 * foot's offset before the first swing, on to the second's between the swings,
 * and back to the middle after the second.
 *
 * Over 0 to 1 s with the feet 0.2 m either side of the pelvis.
 *
 * Scenarios:
 *
 * 1. The swings are [0.17, 0.43] and [0.57, 0.83] s.
 * 2. The pelvis starts centred, stands 0.13 m toward the first foot as it swings,
 *    centred midway between the swings, 0.13 m toward the second as it swings,
 *    and centred again at the end.
 */
export function test_unit_motions_sport_racket_stance_transfer(): void {
  const transfer: racketStanceTransfer.ITransfer = racketStanceTransfer(
    0,
    1,
    0.2,
    -0.2,
  );
  TestValidator.equals("the swing windows", transfer.swings, [
    [0.17, 0.43],
    [0.57, 0.83],
  ]);
  TestValidator.predicate(
    "the pelvis between the feet",
    nclose(transfer.offset(0), 0, 1e-12) &&
      nclose(transfer.offset(0.3), 0.13, 1e-12) &&
      nclose(transfer.offset(0.5), 0, 1e-12) &&
      nclose(transfer.offset(0.7), -0.13, 1e-12) &&
      nclose(transfer.offset(1), 0, 1e-12),
  );
}
