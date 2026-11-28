import {
  hoseLineReaction
} from "../../../../../packages/motions/src/tasks/internal/hoseLineReaction";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The `hoseLine` law's own logic (`hoseLineReaction`): the IFSTA fog-nozzle
 * reaction NR = 0.0505 Q sqrt(P), 75.75 lbf for 150 gpm at 100 psi, shared by
 * the two members, each leaning `atan(NR / 2 / (m g))` into it; the stand sets
 * over 0.6 s, sweeps `SWEEP` (1.2 s) each and shuts over 0.6 s.
 *
 * Scenarios:
 *
 * 1. The reaction is 75.75 lbf, 336.94 N.
 * 2. A 70 kg member leans `atan(168.47 / 686.7)` = 13.78 degrees.
 * 3. Two sweeps open the stream at 0.6 s and shut it at 3 s, 3.6 s in all.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the staged nozzle reaction, shared rig lean and open, sweep and shut timing.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the reaction, stance and timeline helpers with fixed nozzle rating, mass and two sweeps.
 * @evidence contracts/development/testing.md#independent-expectations The supplied reaction formula gives 75.75 lbf, and half its converted load over 70g sets the 13.78° lean. The authored phases total 3.6 s.
 */
export function test_motions_tasks_hose_line(): void {
  const stand: hoseLineReaction.IStand = hoseLineReaction(70, 2, 1);
  const reaction: number = 75.75 * 4.448;
  TestValidator.predicate(
    "the reaction, the lean and the clock",
    nclose(hoseLineReaction.REACTION, reaction, 1e-9) &&
      nclose(
        stand.lean,
        (Math.atan(reaction / 2 / (70 * 9.81)) * 180) / Math.PI,
        1e-9,
      ) &&
      nclose(stand.clock.at("strokeStart"), 0.6, 1e-12) &&
      nclose(stand.clock.at("strokeEnd"), 3, 1e-12) &&
      nclose(stand.clock.duration, 3.6, 1e-12),
  );
}
