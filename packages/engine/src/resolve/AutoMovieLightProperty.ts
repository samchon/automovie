/** A light property a shot's `lightMotions` may animate.
 *
 * @evidence contracts/common.md#principled-implementation The closed union names intensity/color/range/coneAngle/position/rotation properties supported by shot light-motion channel resolution; property-specific scalar/vector/quaternion semantics are owned by parse/apply lighting helpers.
 * @evidence contracts/common.md#clear-and-simple-design One discriminant type joins light pointer parsing and override dispatch without a generic arbitrary-property writer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only implemented light-channel properties are represented; this union is compile-time shape and runtime unknown-name refusal remains with isLightProperty/parseLightPointer.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies animatable light properties; corresponding override/channel members document units and widths.
 * @evidence contracts/performance.md#efficient-algorithms One scalar discriminant adds no algorithm or collection storage; runtime dispatch has a fixed supported property population.
 * @evidence contracts/performance.md#reuse-equivalent-work Lighting helpers reuse the same property type and runtime predicate; no override result is cached by property spelling.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No light record, renderer handle or animation task is retained by this type.
 */
export type AutoMovieLightProperty =
  | "intensity"
  | "color"
  | "range"
  | "coneAngle"
  | "position"
  | "rotation";
