import { AutoMovieLightProperty } from "./AutoMovieLightProperty";
import { LIGHT_CHANNEL_PROPERTIES } from "./constants/LIGHT_CHANNEL_PROPERTIES";

/** Whether a string names an animatable light property.
 *
 * @evidence contracts/common.md#principled-implementation Test an own key of the canonical light-channel property table, so only actually implemented axes are classified as animatable.
 * @evidence contracts/common.md#clear-and-simple-design The supported-property predicate and runtime writers share one table instead of independently maintained property-name sets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inherited object members such as constructor do not pass; the predicate does not establish that a particular light kind carries the property.
 * @evidence contracts/common.md#meaningful-documentation Docs distinguish animatable property names from light-kind/channel-value admission owned by the table and shot gate.
 * @evidence contracts/performance.md#efficient-algorithms One own-key check over the fixed property population requires O(1) work and no per-call allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Parser and validation consumers reuse the same table membership law; no separate name cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the predicate boolean escapes, with no override record, scene object, handle or task held.
 */
export const isLightProperty: (
  property: string,
) => property is AutoMovieLightProperty = (
  property: string,
): property is AutoMovieLightProperty =>
  Object.hasOwn(LIGHT_CHANNEL_PROPERTIES, property);
