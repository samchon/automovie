import { HumanMediumWalk, AutoMovieMotionHumanRefusal } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * Each medium is admitted against the anatomical limit of its footing.
 *
 * Scenarios:
 *
 * 1. Water permits positive depths to the chest inclusive, and refuses dry and
 *    deeper cases. Mud admits dry footing and the shank boundary.
 * 2. Snow below or beyond the shank is refused with that shank's range.
 */
export function test_motions_carrier_medium_depth(): void {
  const measure: HumanMediumWalk.IMeasure = { chestHeight: 1.2, shank: 0.4 };
  HumanMediumWalk.admitDepth({ kind: "water", depth: 1.2 }, measure);
  HumanMediumWalk.admitDepth({ kind: "mud", depth: 0 }, measure);
  HumanMediumWalk.admitDepth({ kind: "mud", depth: 0.4 }, measure);

  function limit(
    kind: "water" | "snow",
    depth: number,
  ): number | null | undefined {
    try {
      HumanMediumWalk.admitDepth({ kind, depth }, measure);
    } catch (error: unknown) {
      if (!(error instanceof AutoMovieMotionHumanRefusal)) throw error;
      if (error.axis === "medium.depth" && error.feasible?.kind === "range")
        return error.feasible.maximum;
    }
    return undefined;
  }
  TestValidator.equals(
    "use the admitted medium's anatomical limit",
    [
      limit("water", 0),
      limit("water", 1.3),
      limit("snow", -0.01),
      limit("snow", 0.5),
    ],
    [1.2, 1.2, 0.4, 0.4],
  );
}
