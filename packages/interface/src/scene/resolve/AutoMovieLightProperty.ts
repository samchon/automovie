/** A light property a shot's `lightMotions` may animate.
 *
 * @evidence contracts/development/design.md#principled-representation The closed union names intensity/color/range/coneAngle/position/rotation properties supported by shot light-motion channel resolution; property-specific scalar/vector/quaternion semantics are owned by parse/apply lighting helpers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One discriminant type joins light pointer parsing and override dispatch without a generic arbitrary-property writer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only implemented light-channel properties are represented; this union is compile-time shape and runtime unknown-name refusal remains with isLightProperty/parseLightPointer.
 * @evidence contracts/development/common.md#meaningful-documentation The comment identifies animatable light properties; corresponding override/channel members document units and widths.
 */
export type AutoMovieLightProperty =
  | "intensity"
  | "color"
  | "range"
  | "coneAngle"
  | "position"
  | "rotation";
