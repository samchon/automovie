import type { IAutoMovieMotionHumanBody } from "@automovie/interface";

/*
 * How far a grappler's front stands ahead of the hips with the trunk pitched
 * about the hip joint: a point at height h above the hip is carried forward by
 * h sin(pitch), and the front is the surface ahead of it, the chest's half
 * depth before the chest and the head's radius before the head. The staged
 * marks (`grapple.spacing`) and the sumo tachiai's contact gap
 * (`grappleSumo.keys`) read their bodies' fronts here.
 */
export namespace grappleFront {
  /*
   * The chest's front ahead of the hips.
   * Parameter body: The body.
   * Parameter pitch: The trunk's pitch, degrees.
   * Returns: Metres.
   */
  export function chest(
    body: {
      measure: Pick<
        IAutoMovieMotionHumanBody["measure"],
        "chestHeight" | "hipHeight" | "chestDepth"
      >;
    },
    pitch: number,
  ): number {
    const m: typeof body.measure = body.measure;
    return (
      (m.chestHeight - m.hipHeight) * Math.sin((pitch * Math.PI) / 180) +
      m.chestDepth / 2
    );
  }

  /*
   * The head's front ahead of the hips.
   * Parameter body: The body.
   * Parameter pitch: The trunk's pitch, degrees.
   * Returns: Metres.
   */
  export function head(
    body: {
      measure: Pick<
        IAutoMovieMotionHumanBody["measure"],
        "headHeight" | "headRadius" | "hipHeight"
      >;
    },
    pitch: number,
  ): number {
    const m: typeof body.measure = body.measure;
    return (
      (m.headHeight - m.headRadius - m.hipHeight) *
        Math.sin((pitch * Math.PI) / 180) +
      m.headRadius
    );
  }
}
