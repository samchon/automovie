import type { IAutoMovieConstructionProfile } from "@automovie/interface";

import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import type { IAutoMovieConstructionProfileSource } from "./IAutoMovieConstructionProfileSource";

/**
 * Admit explicit original end roles and exact periodic source-chart capability.
 *
 * A pole names an actual point collapse of the entire original contour; it
 * never caps an ordinary open end. The source keeps its original Point0 and
 * unavailable physical2 there. A periodic surface is available only when one
 * actual piece covers one whole period of its same original function.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines pole versus open end and original versus normalized period without claiming final skin or global topology.
 * @evidence contracts/development/design.md#principled-representation Represents Admit explicit original end roles and exact periodic source-chart capability: companion namespace of 2 members (`admit`, `period`). It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieConstructionProfileTopology` in packages/engine/src/geometry/construction/AutoMovieConstructionProfileTopology.ts; its surface is the 2 members listed and the text shows 2 other files naming it, mostly packages/engine (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieConstructionProfileTopology {
  /**
   * Validate only the declared capability shape; actual source geometry remains authoritative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Validate only the declared capability shape; actual source geometry remains authoritative.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Validate only the declared capability shape; actual source geometry remains authoritative) directly over its typed inputs (`definition`, `source`) as nested iteration of depth 2 (for-of over definition.loops; for-of over loop.pieces), delegating to `Number.isFinite`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 11 lines and 1 top-level statements that reuses `Number.isFinite` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `definition`, `source`; the dominant cost is nested iteration of depth 2 (for-of over definition.loops; for-of over loop.pieces), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function admit(
    definition: IAutoMovieConstructionProfile,
    source: IAutoMovieConstructionProfileSource,
  ): void {
    for (const loop of definition.loops) {
      if (
        loop.pole !== undefined &&
        loop.pole !== "bottom" &&
        loop.pole !== "top" &&
        loop.pole !== "both"
      )
        throw new AutoMovieLoftAdmissionError(
          `Original loop ${loop.id} has an unsupported collapsed-end role.`,
        );
      for (const piece of loop.pieces) {
        const curve: IAutoMovieConstructionProfileSource.ICurve | undefined =
          source.curves.get(piece.source);
        if (
          curve?.period !== undefined &&
          !(Number.isFinite(curve.period) && curve.period > 0)
        )
          throw new AutoMovieLoftAdmissionError(
            `Original piece ${piece.id} has no finite positive declared period.`,
          );
      }
    }
  }

  /**
   * Normalize one complete original period without fitting or joining different functions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Normalize one complete original period without fitting or joining different functions.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Normalize one complete original period without fitting or joining different functions) directly over its typed inputs (`loop`, `piece`, `curve`) as a fixed number of statements with no loop or recursion in the body; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 3 lines and 1 top-level statements that calls no other named helper; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `loop`, `piece`, `curve`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function period(
    loop: IAutoMovieConstructionProfile.ILoop,
    piece: IAutoMovieConstructionProfile.IPiece,
    curve: IAutoMovieConstructionProfileSource.ICurve,
  ): number | undefined {
    return loop.pieces.length === 1 &&
      curve.period !== undefined &&
      piece.clock[1] === piece.clock[0] + curve.period
      ? 1
      : undefined;
  }
}
