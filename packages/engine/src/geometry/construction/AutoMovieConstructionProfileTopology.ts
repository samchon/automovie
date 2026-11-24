import type {
  IAutoMovieConstructionProfile,
  IAutoMovieConstructionProfileLoop,
  IAutoMovieConstructionProfilePiece,
  IAutoMovieConstructionProfileSource,
} from "@automovie/interface";

import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";

/**
 * Admit explicit original end roles and exact periodic source-chart capability.
 *
 * A pole names an actual point collapse of the entire original contour; it
 * never caps an ordinary open end. The source keeps its original Point0 and
 * unavailable physical2 there. A periodic surface is available only when one
 * actual piece covers one whole period of its same original function.
 */
export namespace AutoMovieConstructionProfileTopology {
  /**
   * Validate only the declared capability shape; actual source geometry remains
   * authoritative.
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
          !(curve.period > 0)
        )
          throw new AutoMovieLoftAdmissionError(
            `Original piece ${piece.id} has no finite positive declared period.`,
          );
      }
    }
  }

  /**
   * Normalize one complete original period without fitting or joining different
   * functions.
   */
  export function period(
    loop: IAutoMovieConstructionProfileLoop,
    piece: IAutoMovieConstructionProfilePiece,
    curve: IAutoMovieConstructionProfileSource.ICurve,
  ): number | undefined {
    return loop.pieces.length === 1 &&
      curve.period !== undefined &&
      piece.clock[1] === piece.clock[0] + curve.period
      ? 1
      : undefined;
  }
}
