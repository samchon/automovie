import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanShiftStandingWeight,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFrame,
  HumanRefusal,
  shiftStandingWeight,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of one rotation of the authored offset, metres. */
const ROUNDING: number = 1e-9;

/**
 * `shiftStandingWeight`'s plan moves the pelvis sideways by the authored
 * distance in the entry's frame with both feet held on their entry goals,
 * eased over `duration`, held over `hold` and, given `returnSeconds`, brought
 * back over it.
 *
 * At a 37-degree heading from (1, 0, -1): a 20 mm shift to the left that is
 * held, and one to the right that returns.
 *
 * Scenarios:
 *
 * 1. Half way through the transfer the root has moved part of the way.
 * 2. Through the hold it is shifted by exactly the request, in the entry's
 *    frame; at the end it is back for a returning shift and still shifted
 *    otherwise.
 * 3. Both feet keep their entry goals throughout.
 * 4. The events stand at `duration`, then `duration + hold` and the end.
 * 5. A one-metre request is refused on the `by` axis.
 */
export async function test_unit_motions_everyday_shift_standing_weight_plan(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const yaw: number = 37;
  const plan = (
    params: IAutoMovieMotionHumanShiftStandingWeight,
  ): IAutoMovieMotionHumanActionPlan =>
    shiftStandingWeight.plan(
      motionActionContext(body, params, { at: { x: 1, y: 0, z: -1 }, yaw }),
    );
  for (const by of [-0.02, 0.02]) {
    const returns: boolean = by > 0;
    const shifted: IAutoMovieMotionHumanActionPlan = plan({
      by,
      duration: 0.8,
      hold: 0.3,
      ...(returns ? { returnSeconds: 0.6 } : {}),
    });
    const entry: IAutoMovieMotionHumanActionPlan["posture"] = (t: number) =>
      shifted.posture(t);
    const origin: IAutoMovieVector3 = entry(0).root;
    const local = (t: number): IAutoMovieVector3 =>
      HumanFrame.local({ origin, yaw }, entry(t).root);

    // 1. Part of the way.
    const halfway: number = local(0.4).x / by;
    TestValidator.predicate(
      `${by}: part of the way at half the transfer (${halfway})`,
      halfway > 0 && halfway < 1,
    );

    // 2. Held, then back or kept.
    TestValidator.predicate(
      `${by}: shifted by the request through the hold`,
      vclose(local(0.95), { x: by, y: 0, z: 0 }, ROUNDING),
    );
    TestValidator.predicate(
      `${by}: at the end`,
      vclose(
        local(shifted.duration),
        { x: returns ? 0 : by, y: 0, z: 0 },
        ROUNDING,
      ),
    );

    // 3. The feet held.
    for (const leg of ["leftLeg", "rightLeg"] as const)
      TestValidator.predicate(
        `${by}: the ${leg} keeps its goal`,
        [0.19, 0.73, 0.95, shifted.duration].every((t: number): boolean =>
          vclose(entry(t).limbs[leg]!.point, entry(0).limbs[leg]!.point, ROUNDING),
        ),
      );

    // 4. The events.
    const event = (name: string): number | undefined => {
      const found: IAutoMovieMotionEvent | undefined = shifted.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === name,
      );
      return found === undefined ? undefined : found.share * shifted.duration;
    };
    TestValidator.predicate(
      `${by}: the phase events`,
      nclose(event("shifted")!, 0.8, ROUNDING) &&
        (returns
          ? nclose(event("release")!, 1.1, ROUNDING) &&
            nclose(event("returned")!, 1.7, ROUNDING)
          : event("release") === undefined && event("returned") === undefined),
    );
  }

  // 5. Too far.
  let refused: unknown;
  try {
    plan({ by: 1 });
  } catch (error: unknown) {
    refused = error;
  }
  TestValidator.predicate(
    "a one-metre shift is refused on by",
    refused instanceof HumanRefusal && refused.axis === "by",
  );
}
