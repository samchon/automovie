import type { IAutoMovieComposition } from "@automovie/interface";

/**
 * Construct composition trees while preserving the supplied intent and node
 * references. These helpers do not resolve timing or validate anchor names.
 * Alignment offsets are seconds in the containing composition's clock.
 */
export namespace AutoMovieEngineComposition {
  /**
   * Normalize a part without copying an existing composition node.
   *
   * A tagged chain contributes its node, a composition contributes itself, and
   * a plain intent receives one intent wrapper. No schedule is resolved.
   */
  export function of(part: IAutoMovieComposition.Part): IAutoMovieComposition {
    if ("type" in part) return part.type === "chain" ? part.node : part;
    return { type: "intent", intent: part };
  }

  /**
   * Build a sequence in the supplied order.
   *
   * The returned parts array is new. Existing child nodes remain shared;
   * durations, anchor validity and start times are resolved later.
   */
  export function sequence(
    ...parts: IAutoMovieComposition.Part[]
  ): IAutoMovieComposition.ISequence {
    return { type: "sequence", parts: parts.map(of) };
  }

  /**
   * Build a group whose children start together when scheduled.
   *
   * The returned parts array is new and retains input order and existing child
   * node references. Construction does not determine the group's duration.
   */
  export function parallel(
    ...parts: IAutoMovieComposition.Part[]
  ): IAutoMovieComposition.IParallel {
    return { type: "parallel", parts: parts.map(of) };
  }

  /**
   * Declare alignment of a part to an earlier anchor.
   *
   * The offset defaults to zero seconds in the composition clock. Omitted
   * instant fields remain absent for the schedule resolver to apply its
   * anchor-event and part-alignment defaults; this helper checks no anchor.
   *
   * @param anchor Anchor identifier resolved by the scheduler.
   * @param part Child to normalize, preserving an existing node's identity.
   * @param offset Seconds after the selected anchor instant.
   * @param instant Optional anchor event/index and child alignment instant.
   */
  export function at(
    anchor: string,
    part: IAutoMovieComposition.Part,
    offset: number = 0,
    instant: Pick<IAutoMovieComposition.IAt, "event" | "index" | "align"> = {},
  ): IAutoMovieComposition.IAt {
    return { type: "at", anchor, offset, part: of(part), ...instant };
  }
}
