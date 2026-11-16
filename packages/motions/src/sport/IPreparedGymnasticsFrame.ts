import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * The original COM-placed demands and exact floor reading sharing one
 * joint-only query's canonical geometry. Release the frame with that query.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish original raw posture demands from the canonical collider-derived floor height, with world-metre units and synchronous query ownership.
 * @evidence contracts/development/design.md#principled-representation One original posture remains separate from one floor-height operation over the same actual canonical map, so sharing geometry cannot certify or replace authored goals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepareGymnasticsFrame produces exactly the posture read by highJump/GymnasticsMat and the floor reader used by their real touchdown/rest consumers; no action parameter or public barrel surface is added.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains no resolved flag, stored acceptance verdict, alternative target, optional solver state or range override; floor remains the owning exact collider reduction.
 */
export interface IPreparedGymnasticsFrame {
  /** Original clinical demands with only the root moved to the requested world COM. Editing these demands does not reprepare the frame's captured geometry. */
  posture: IHumanPosture;

  /**
   * Read the root Y, in metres, that rests this articulation's lowest
   * collider on world zero. Release this reader with its current query frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines world-metre root height, the floor-zero convention, original articulation and frame-owned reader lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation The actual prepareGymnasticsFrame producer delegates its current canonical bone map's exact collider minimum Y to KnockdownFloor.lowest and negates it; the source map was resolved at root Y zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One existing bounds reduction keeps physical floor policy with KnockdownFloor while this reader shares only the map already used for COM placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every actual collider bound remains evaluated. No floor verdict, target substitution, tolerance change or arbitrary prepared flag supplies the result.
   * @evidence contracts/development/implementation.md#efficient-algorithms The actual reader traverses S profile segments and C shapes plus original hull vertices, without a second canonical solve/FK, flattened wrappers or unused bound axes/maxima; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only this synchronous query's actual canonical bones are shared with COM placement; changed posture queries construct independent frames and the floor value itself is never cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader borrows its frame-owned body/map only until the query releases the frame, with no FK supplier, previous-query history, external handle or global retention.
   */
  floor(): number;
}
