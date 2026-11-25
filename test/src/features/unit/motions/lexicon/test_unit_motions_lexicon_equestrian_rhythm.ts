import { humanEquestrianRhythm } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * The `HumanRide.ride` law's equestrian rhythm (`humanEquestrianRhythm`):
 * walk and trot pitch the rider twice a stride (1.5 and 2.5 degrees, Byström et
 * al.), canter and gallop rock once and roll toward the lead; a jump rises to
 * the two-point seat over its approach, holds it in flight (Clayton 1989) and
 * settles; a look back turns to its peak and back.
 *
 * Scenarios:
 *
 * 1. Touchdowns at 0, 1 and 2 s put 1.5 s halfway through the second stride.
 * 2. A full-weight trot three eighths through its stride pitches
 *    `2.5 sin(1.5 π)(1 - cos(0.75 π))` degrees and does not roll; a right-lead
 *    canter at a quarter rolls -1 degree.
 * 3. A jump approaching from 1 s, taking off at 2 s, landing at 3 s and
 *    recovered at 4 s holds the two-point seat at 2.5 s, folded most there, and
 *    is half risen at 1.5 s.
 * 4. A look back peaking at 2 s over a 1 s turn has turned fully at 2 s and not
 *    at 2.5 s.
 */
export function test_unit_motions_lexicon_equestrian_rhythm(): void {
  TestValidator.predicate(
    "the gait's phase",
    nclose(humanEquestrianRhythm.phase([0, 1, 2], 1.5), 0.5, 1e-12) &&
      humanEquestrianRhythm.phase([0, 1, 2], 2.5) === 0,
  );
  const trot: humanEquestrianRhythm.IResponse = humanEquestrianRhythm({
    at: 0,
    active: 1,
    stride: { gait: "trot", phase: 0.375 },
  });
  const canter: humanEquestrianRhythm.IResponse = humanEquestrianRhythm({
    at: 0,
    active: 1,
    stride: { gait: "canter", lead: "right", phase: 0.25 },
  });
  TestValidator.predicate(
    "the trot's pitch and the canter's roll",
    nclose(
      trot.pitch,
      2.5 * Math.sin(1.5 * Math.PI) * (1 - Math.cos(0.75 * Math.PI)),
      1e-12,
    ) &&
      trot.roll === 0 &&
      nclose(canter.roll, -1, 1e-12),
  );
  const jump: humanEquestrianRhythm.Jump = [1, 2, 3, 4];
  const flight: humanEquestrianRhythm.IResponse = humanEquestrianRhythm({
    at: 2.5,
    active: 0,
    jump,
  });
  TestValidator.predicate(
    "the jump",
    flight.rise === 1 &&
      nclose(flight.airborne, 1, 1e-12) &&
      nclose(humanEquestrianRhythm.jumping(jump, 1.5), 0.5, 1e-12),
  );
  TestValidator.predicate(
    "the look back",
    humanEquestrianRhythm({ at: 2, active: 0, look: { peak: 2, half: 0.5 } })
      .turn === 1 &&
      humanEquestrianRhythm({ at: 2.5, active: 0, look: { peak: 2, half: 0.5 } })
        .turn === 0,
  );
}