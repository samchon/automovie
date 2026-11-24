import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanChain, HumanRefusal } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionFloorRise } from "../../../features/internal/motionFloorRise";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";

/**
 * An explicit supine rotation rolls onto the hands and knees before standing.
 *
 * Scenarios:
 * 1. The small body crosses its lower-leg seam continuously.
 * 2. The large body reaches the rotating route's stance-three foot target
 *    and finishes standing on its soles, within the same spatial limits.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the request, the two different failures and their specimens.
 * @evidence contracts/development/testing.md#behavioral-verification Measures the entire displayed roll at 120 Hz, its contact with the floor, and both terminal feet and hips.
 * @evidence contracts/development/testing.md#independent-expectations Uses the unchanged quiet hips, collider floor and finite-difference limits in motionFloorRise.
 * @evidence contracts/development/testing.md#distinguishing-cases The small specimen exposes the lower-leg seam and the large one the former 11.2 mm refusal at stance three.
 * @evidence contracts/development/testing.md#execution-ownership Two rolls retain their original independent body, seed and lying entry.
 */
export function test_motion_floor_base_transition(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["f-small", "m-large"] as const)
    motionFloorRise(
      all,
      name,
      "supine rotation",
      HumanChain.subject("a")
        .lieDown({ kind: "supine", hold: 0.3 })
        .getUp({ pattern: "rotation" }),
    );
  motionFloorRise(
    all,
    "f-small",
    "supine symmetric",
    HumanChain.subject("a").lieDown({ kind: "supine", hold: 0.3 }).getUp(),
  );
  motionFloorRise(
    all,
    "m-large",
    "prone",
    HumanChain.subject("a").lieDown({ kind: "prone", hold: 0.3 }).getUp(),
  );
  motionFloorRise(
    all,
    "f-small",
    "hands and knees",
    HumanChain.subject("a").crawl({ count: 1 }).getUp(),
  );
  const body: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  try {
    motionHumanLaw.perform(
      "get-up",
      [{ subject: "a", body }],
      HumanChain.subject("a")
        .knockdown({ hold: 0.5 })
        .getUp()
        .crawl({ count: 1 }),
    );
  } catch (error) {
    all.check(
      `knockdown, getUp, crawl: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
  let refusal: unknown;
  try {
    motionHumanLaw.perform(
      "get-up",
      [{ subject: "a", body }],
      HumanChain.subject("a").stand({ hold: 0.3 }).getUp(),
    );
  } catch (error) {
    refusal = error;
  }
  if (
    refusal instanceof HumanRefusal &&
    refusal.feasible?.kind === "alternatives"
  ) {
    all.check(
      "standing is refused on the entry base",
      refusal.kind === "base" &&
        refusal.axis === "base" &&
        refusal.value === "standing",
    );
    all.equals(
      "the supported bases are the floor entrances",
      [...refusal.feasible.values].sort((a, b): number =>
        String(a).localeCompare(String(b)),
      ),
      ["crouched", "kneeling", "lying"],
    );
  } else all.check("standing is refused with the permitted floor bases", false);
  all.assert(
    "each admissible floor base reaches standing and a standing entry is refused",
  );
}
