import { createNecklace } from "@automovie/archetypes";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { placeOverHeadScene } from "../../internal/placeOverHeadScene";

/**
 * A necklace set over the head of a partner seated facing away, from behind, on
 * its own: the `chain` cases of `test_motion_get_dressed_place_over_head`, the
 * average man dressing the small woman and the reverse, entered by the minimal
 * chain the partner's sit, the dresser's wait > pickUp(loop) (the grammar has
 * no entry state; the partner's rise after it is left out).
 *
 * Scenarios:
 *
 * 1. Both hands' grips on the loop end as it is worn, the second hand's carrying
 *    nothing.
 * 2. The worn loop's back lies on the partner's nape within 15 mm.
 * 3. The placing keeps the shipped bounds over its own span, the partner bound
 *    between the two bodies included.
 *
 * Decomposes the original's checks 1 and 2 for the necklace from behind, which
 * ran there only after both ribbon cases passed; the ride through the rise is
 * `test_motion_get_dressed_place_over_head_worn_rise`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and cases it decomposes, the entry chain, the pairs and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the plan's windows, the displayed loop against the partner's displayed nape and the verdict report over the placing's span; grips that outlast the wear, a loop off the nape, a forearm through the partner or a finding in the placing fails, each pair on its own.
 * @evidence contracts/development/testing.md#independent-expectations The nape contact is a skin contact and the ribbon's thickness, as the original; the windows' ends are the wear's instant the law states.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body pairs of opposite heights; the ribbon from in front is `test_motion_get_dressed_place_over_head_front`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, entered through `test_motion_get_dressed_place_over_head_behind`.
 */
export function test_motion_get_dressed_place_over_head_behind(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const [dresser, partner] of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const) {
    const label: string = `${dresser} sets a chain on ${partner}`;
    try {
      const b: IAutoMovieMotionHumanBody = motionHumanBody(partner);
      const loop: placeOverHeadScene.Loop = createNecklace({
        id: "loop",
        kind: "chain",
      });
      const film: HumanPerformance = placeOverHeadScene.scene(
        motionHumanBody(dresser),
        b,
        loop,
        "behind",
        { rise: false },
      );
      placeOverHeadScene.placed(checks, label, film, b, loop);
    } catch (error: unknown) {
      checks.check(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  checks.assert("a necklace is set over a seated partner's head from behind");
}
