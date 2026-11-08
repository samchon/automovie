/**
 * Engineering discipline selecting the supported medium rules for one service system.
 *
 * @evidence contracts/development/design.md#principled-representation validateServiceNetwork matches each discipline to its declared supported media, while serviceAnalysisSupport reports the quantitative solver missing for each actual discipline.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One shared graph vocabulary separates domain-specific admission rules from topology and avoids independent network shapes for each discipline.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A discipline label does not claim hydraulic, electrical or duct simulation; other medium is an explicit unit-check escape rather than guessed domain support.
 * @evidence contracts/development/common.md#meaningful-documentation Defines rule-selection ownership and its separation from quantitative analysis capability.
 */
export type AutoMovieServiceDiscipline =
  | "plumbing"
  | "drainage"
  | "electrical"
  | "data"
  | "hvac"
  | "fire"
  | "control";
