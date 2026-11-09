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
 * @evidence contracts/common.md#principled-implementation Closed end-role data and the original function's declared period determine chart topology without altering points, clocks or derivatives; the actual collapse still belongs to source and realization admission.
 * @evidence contracts/common.md#clear-and-simple-design A small topology owner validates new capabilities while the existing Profile evaluator retains world geometry and source indexing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A label or coincident sampled endpoints is not a whole-period, regularity or collapse certificate. Missing period leaves the bounded piece chart and missing physical2 remains unavailable.
 * @evidence contracts/common.md#meaningful-documentation Defines pole versus open end and original versus normalized period without claiming final skin or global topology.
 * @evidence contracts/performance.md#efficient-algorithms Admission visits P declared pieces once with constant scalar checks per piece; a single-piece period query is constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the same original owners already resolved by Profile, without a second curve or geometry preparation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous scalar checks retain no declaration, source, cache or external handle.
 */
export namespace AutoMovieConstructionProfileTopology {
  /** Validate only the declared capability shape; actual source geometry remains authoritative. */
  export function admit(definition: IAutoMovieConstructionProfile, source: IAutoMovieConstructionProfileSource): void {
    for (const loop of definition.loops) {
      if (loop.pole !== undefined && loop.pole !== "bottom" && loop.pole !== "top" && loop.pole !== "both")
        throw new AutoMovieLoftAdmissionError(`Original loop ${loop.id} has an unsupported collapsed-end role.`);
      for (const piece of loop.pieces) {
        const curve: IAutoMovieConstructionProfileSource.ICurve | undefined = source.curves.get(piece.source);
        if (curve?.period !== undefined && !(Number.isFinite(curve.period) && curve.period > 0))
          throw new AutoMovieLoftAdmissionError(`Original piece ${piece.id} has no finite positive declared period.`);
      }
    }
  }

  /** Normalize one complete original period without fitting or joining different functions. */
  export function period(loop: IAutoMovieConstructionProfile.ILoop, piece: IAutoMovieConstructionProfile.IPiece, curve: IAutoMovieConstructionProfileSource.ICurve): number | undefined {
    return loop.pieces.length === 1 && curve.period !== undefined && piece.clock[1] === piece.clock[0] + curve.period ? 1 : undefined;
  }
}
