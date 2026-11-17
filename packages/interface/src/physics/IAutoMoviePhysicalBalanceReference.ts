import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMoviePhysicalSimulationInput } from "./IAutoMoviePhysicalSimulationInput";
import type { IAutoMoviePhysicalTargetInterval } from "./IAutoMoviePhysicalTargetInterval";

/**
 * The completed fitted balance reference at a replan boundary and the authored placements at that same boundary. The completed fitted balance reference at a replan boundary and the authored placements at that same boundary.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the previous fitted plan and the cache/native boundary used for a new reference. Pairs fitted and authored placements at one completed boundary, or reports no usable reference.
 * @evidence contracts/development/design.md#principled-representation Cache step and Hz locate the interval; start is local seconds on the native grid, and transforms are world metres/unit rotations. The union with undefined makes absent continuity explicit; both maps contain world bone-origin rigid transforms at the same instant.
 * @evidence contracts/development/design.md#minimal-and-owned-surface physicalBalanceReference combines canonical authored targets and fitted plans for continuity-aware support replanning. Support target planners use completed for continuity and before to transport correction through current authored coordinates.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A noncontiguous previous plan supplies no completed reference; a same-interval revision uses the completed preceding native boundary. No synthetic completed pose is substituted when the preceding plan is absent or not contiguous.
 */
export namespace IAutoMoviePhysicalBalanceReference {
  /**
   * The completed fitted balance reference at a replan boundary and the authored
   * placements at that same boundary. A replan in the next interval starts from
   * the previous plan's endpoint; a revision inside the interval starts at the
   * preceding native tick of the previous plan. Without a contiguous previous
   * plan there is no completed reference.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the previous fitted plan and the cache/native boundary used for a new reference.
   * @evidence contracts/development/design.md#principled-representation Cache step and Hz locate the interval; start is local seconds on the native grid, and transforms are world metres/unit rotations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalBalanceReference combines canonical authored targets and fitted plans for continuity-aware support replanning.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A noncontiguous previous plan supplies no completed reference; a same-interval revision uses the completed preceding native boundary.
   */
  export type IInput = {
    /** Body whose authored targets bound the interval. */ body: IAutoMoviePhysicalSimulationInput.IBody;
    /** Current interval's authored end target. */ target: IAutoMoviePhysicalSimulationInput.ITarget;
    /** The previous fitted plan, if any. */ previous:
      | IAutoMoviePhysicalTargetInterval.IPlan
      | undefined;
    /** Enclosing cache interval. */ step: number;
    /** Replan boundary, seconds on the native tick grid. */ start: number;
    /** Declared cache frequency, hertz. */ rate: number;
  };

  /**
   * The completed fitted balance reference at a replan boundary and the authored
   * placements at that same boundary. A replan in the next interval starts from
   * the previous plan's endpoint; a revision inside the interval starts at the
   * preceding native tick of the previous plan. Without a contiguous previous
   * plan there is no completed reference.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Pairs fitted and authored placements at one completed boundary, or reports no usable reference.
   * @evidence contracts/development/design.md#principled-representation The union with undefined makes absent continuity explicit; both maps contain world bone-origin rigid transforms at the same instant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Support target planners use completed for continuity and before to transport correction through current authored coordinates.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No synthetic completed pose is substituted when the preceding plan is absent or not contiguous.
   */
  export type IResult =
    | {
        /** Fitted placements already delivered at the boundary. */ completed: Record<
          string,
          IAutoMovieRigidTransform
        >;
        /** Authored placements at the same boundary. */ before: Record<
          string,
          IAutoMovieRigidTransform
        >;
      }
    | undefined;
}
