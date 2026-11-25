import type { IAutoMovieMotionHumanHeldWork } from "@automovie/interface";
import { HumanRefusal, admitHeldWork } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `admitHeldWork`, the admission of `workHeld.plan`: a held work drives an
 * articulation, moves the prop or takes another, over a positive duration.
 *
 * Scenarios:
 *
 * 1. A work that only moves the prop, or only takes one, over 1 s is admitted.
 * 2. No drive, no place and no take, and an empty drive list alike, are refused on
 *    `drive`.
 * 3. A move over 0 s is refused on `duration`.
 */
export function test_unit_motions_handling_work_held(): void {
  const at: IAutoMovieMotionHumanHeldWork.IPlace = {
    out: 0,
    up: 0.3,
    forward: 0.4,
  };
  const take: IAutoMovieMotionHumanHeldWork.IMount = {
    prop: "morsel",
    point: "tips",
  };
  const refused = (
    params: Pick<
      IAutoMovieMotionHumanHeldWork.IParams,
      "drive" | "at" | "take" | "duration"
    >,
  ): HumanRefusal["axis"] | undefined => {
    try {
      admitHeldWork(params);
      return undefined;
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : undefined;
    }
  };
  TestValidator.equals(
    "a work admits with something to do over a positive duration",
    [
      refused({ at, duration: 1 }),
      refused({ take, duration: 1 }),
      refused({ duration: 1 }),
      refused({ drive: [], duration: 1 }),
      refused({ at, duration: 0 }),
    ],
    [undefined, undefined, "drive", "drive", "duration"],
  );
}
