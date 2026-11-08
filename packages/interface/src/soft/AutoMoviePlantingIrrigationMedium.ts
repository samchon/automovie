/**
 * Authored irrigation-water source category on a planting binding.
 *
 * @evidence contracts/development/design.md#principled-representation The closed water-source vocabulary accompanies explicit supply element and demand, with aquatic fluid-domain admission checked independently by installation validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Irrigation medium stays distinct from the general service-network medium because this binding currently cites an environment element, not a typed service port.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Potable, reclaimed, rainwater or pond labels do not establish water quality analysis or a solved supply capacity.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the planting-specific water-source label and its limited declarative authority.
 */
export type AutoMoviePlantingIrrigationMedium =
  | "potable"
  | "reclaimed"
  | "rainwater"
  | "pond";
