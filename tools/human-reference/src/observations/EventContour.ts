/** Saved section contour incident to one physical critical event, without source addresses.
 *
 * @evidence contracts/common.md#principled-implementation The relation names a saved contour and its physical orientation observations, without transferring source topology.
 * @evidence contracts/common.md#clear-and-simple-design One record owns the event-to-section incidence boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No specimen identity or hardcoded mesh address is stored.
 * @evidence contracts/common.md#meaningful-documentation Defines saved-loop indexing, area units and the crossing-count limit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased record owns no retained cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased record opens no resources.
 *
 * @author Samchon
 */
export interface EventContour {
  /** Index into the adjacent saved slice's loop array, never a source mesh index. */
  loop: number;
  /** Material-orientation sign recovered from the supporting source face. */
  winding: number;
  /** Measured signed-order-independent contour area in square millimetres, if defined. */
  area: number | null;
  /** Strict projected self-crossings; contacts and collinear overlap remain unclassified. */
  sourceSelfCrossings: number;
}
