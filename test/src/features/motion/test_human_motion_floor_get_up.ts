import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanChain, HumanRefusal } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionFloorRise } from "../internal/motionFloorRise";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";

/**
 * Getting up follows the support route from the body's actual starting base.
 *
 * Scenarios:
 * 1. From the back, use the symmetric rise. From the front and from crawling,
 *    enter the corresponding suffix of the rolling route. Check floor height,
 *    120 Hz continuity, and the standing hips and feet of all three.
 * 2. Knockdown, rise and crawl compose in sequence.
 * 3. Standing refuses on the base axis with its supported alternatives.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names all three entrances and their physical and admission boundaries.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the actual stage and displayed bones; an incorrect floor exit, unsupported base or discontinuity fails at the measured time.
 * @evidence contracts/development/testing.md#independent-expectations The independent quiet hips, foot collider height, and 30 m/s, 5 mm, 10 mm and 20 mm limits are measured in motionFloorRise.
 * @evidence contracts/development/testing.md#distinguishing-cases Supine symmetric, prone and all-fours enter different physical phases. A composed entry and a standing refusal exercise the base contract.
 * @evidence contracts/development/testing.md#execution-ownership Three measured rises, one accepted sequence and one refused base use the original scenes.
 */
export function test_human_motion_floor_get_up(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  motionFloorRise(all, "f-small", "supine symmetric",
    HumanChain.subject("a").lieDown({ position: "supine", hold: 0.3 }).getUp());
  motionFloorRise(all, "m-large", "prone",
    HumanChain.subject("a").lieDown({ position: "prone", hold: 0.3 }).getUp());
  motionFloorRise(all, "f-small", "hands and knees", HumanChain.subject("a").crawl({ cycles: 1 }).getUp());
  const body: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  try {
    motionHumanLaw.perform("get-up", [{ subject: "a", body }],
      HumanChain.subject("a").knockdown({ seconds: 0.5 }).getUp().crawl({ cycles: 1 }));
  } catch (error) {
    all.check(`knockdown, getUp, crawl: ${error instanceof Error ? error.message : String(error)}`, false);
  }
  let refusal: unknown;
  try {
    motionHumanLaw.perform("get-up", [{ subject: "a", body }],
      HumanChain.subject("a").stand({ seconds: 0.3 }).getUp());
  } catch (error) {
    refusal = error;
  }
  if (refusal instanceof HumanRefusal && refusal.feasible?.kind === "alternatives") {
    all.check("standing is refused on the entry base",
      refusal.kind === "base" && refusal.axis === "base" && refusal.value === "standing");
    all.equals("the supported bases are the floor entrances",
      [...refusal.feasible.values].sort((a, b): number => String(a).localeCompare(String(b))),
      ["crouched", "kneeling", "lying"]);
  } else all.check("standing is refused with the permitted floor bases", false);
  all.assert("getUp enters the route of its floor base");
}
