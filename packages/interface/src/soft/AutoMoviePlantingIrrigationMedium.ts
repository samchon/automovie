/**
 * Authored irrigation-water source category on a planting binding.
 *
 * @evidence contracts/common.md#principled-implementation The closed water-source vocabulary accompanies explicit supply element and demand, with aquatic fluid-domain admission checked independently by installation validation.
 * @evidence contracts/common.md#clear-and-simple-design Irrigation medium stays distinct from the general service-network medium because this binding currently cites an environment element, not a typed service port.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Potable, reclaimed, rainwater or pond labels do not establish water quality analysis or a solved supply capacity.
 * @evidence contracts/common.md#meaningful-documentation Defines the planting-specific water-source label and its limited declarative authority.
 * @author Samchon
 */
export type AutoMoviePlantingIrrigationMedium =
  | "potable"
  | "reclaimed"
  | "rainwater"
  | "pond";
