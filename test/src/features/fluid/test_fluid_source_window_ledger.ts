import {simulateFluidDomain} from "@automovie/engine";
import {TestValidator} from "@nestia/e2e";
import {namedFacts} from "../internal/predicates";
import {createFountainLedgerDomain as fountain} from "../internal/createFountainLedgerDomain";
import {FOUNTAIN_LEDGER_SOURCE as SOURCE} from "../internal/FOUNTAIN_LEDGER_SOURCE";

/**
 * The source activity window owns its opening and closing clock independently of momentum and drain behavior.
 *
 * Scenarios:
 * 1. The unchanged 6 x 6 basin reaches the one-second closing step and absolute step 400.
 * 2. Source volume after close is bit-identical; the start 1,000-second twin remains exactly zero.
 */
export const test_fluid_source_window_ledger=():void=>{
  const steps=400;const dt=fountain({}).solver.fixedStepSeconds;
  const windowed = fountain({ sources: [{ ...SOURCE, end: 1 }] });
  const atClose = simulateFluidDomain(windowed, Math.round(1 / dt));
  const later = simulateFluidDomain(windowed, steps);
  const notYet = simulateFluidDomain(
    fountain({ sources: [{ ...SOURCE, start: 1_000 }] }),
    steps,
  );

  TestValidator.equals("an activity window opens and closes a declared source",namedFacts([
    ["closed",()=>Object.is(later.sourceVolume,atClose.sourceVolume)],
    ["deliveredWhileOpen",()=>atClose.sourceVolume>0],
    ["notYetOpened",()=>Object.is(notYet.sourceVolume,0)],
  ]),{closed:true,deliveredWhileOpen:true,notYetOpened:true});

};
