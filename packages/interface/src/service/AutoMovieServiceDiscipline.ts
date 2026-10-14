/**
 * Engineering discipline selecting the supported medium rules for one service system.
 *
 * @evidence contracts/common.md#principled-implementation validateServiceNetwork matches each discipline to its declared supported media, while serviceAnalysisSupport reports the quantitative solver missing for each actual discipline.
 * @evidence contracts/common.md#clear-and-simple-design One shared graph vocabulary separates domain-specific admission rules from topology and avoids independent network shapes for each discipline.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A discipline label does not claim hydraulic, electrical or duct simulation; other medium is an explicit unit-check escape rather than guessed domain support.
 * @evidence contracts/common.md#meaningful-documentation Defines rule-selection ownership and its separation from quantitative analysis capability.
 * @author Samchon
 */
export type AutoMovieServiceDiscipline =
  | "plumbing"
  | "drainage"
  | "electrical"
  | "data"
  | "hvac"
  | "fire"
  | "control";
