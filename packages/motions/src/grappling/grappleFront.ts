import type { IAutoMovieMotionHumanBody } from "@automovie/interface";

/**
 * How far a grappler's front stands ahead of the hips with the trunk pitched
 * about the hip joint: a point at height h above the hip is carried forward
 * by h sin(pitch), and the front is the surface ahead of it, the chest's
 * half depth before the chest and the head's radius before the head. The
 * staged marks (`grapple.spacing`) and the sumo tachiai's contact gap
 * (`grappleSumo.keys`) read their bodies' fronts here.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is measured, from which joint and which surfaces.
 * @evidence contracts/development/design.md#principled-representation Two metre distances per body and pitch, the chest's and the head's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The chest's front and the head's, read by the grapple law's marks and the sumo tachiai.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The heights and depths are each body's own measure.
 */
export namespace grappleFront {
  /**
   * The chest's front ahead of the hips.
   *
   * @param body The body.
   * @param pitch The trunk's pitch, degrees.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input units and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The chest's height over the hip joint turned by the pitch, and the chest's half depth.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each body's own chest height, hip height and chest depth.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of the measure.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function chest(body: IAutoMovieMotionHumanBody, pitch: number): number {
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    return (
      (m.chestHeight - m.hipHeight) * Math.sin((pitch * Math.PI) / 180) +
      m.chestDepth / 2
    );
  }

  /**
   * The head's front ahead of the hips.
   *
   * @param body The body.
   * @param pitch The trunk's pitch, degrees.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input units and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The head's centre height over the hip joint turned by the pitch, and the head's radius.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each body's own head height, head radius and hip height.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of the measure.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function head(body: IAutoMovieMotionHumanBody, pitch: number): number {
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    return (
      (m.headHeight - m.headRadius - m.hipHeight) *
        Math.sin((pitch * Math.PI) / 180) +
      m.headRadius
    );
  }
}
