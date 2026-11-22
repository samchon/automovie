import type { IAutoMovieMotionHumanGaitStyled } from "./IAutoMovieMotionHumanGaitStyled";

/**
 * Military drill: the Gait family's `march` and `doubleTime` at the regulation's cadence and step (`HUMAN_DRILL_CADENCES`; US Army TC 3-21.5: quick time 120 steps a minute and double time 180, on a 0.762 m step), with the drill, gun drill, musket drill and gun crew rows on `AutoMovieMotionHumanMilitaryDrill` (`HumanDrill`, `HumanGunDrill`, `HumanMusketDrill`, `HumanGunCrew`). The drill adds no method of its own.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the gaits drill marches with, the cadences and step with their source, and the drill rows on the runtime namespace.
 * @evidence contracts/development/design.md#principled-representation The drill's vocabulary is the styled gaits, extended rather than redeclared, so the march keeps one method.
 * @evidence contracts/development/design.md#minimal-and-owned-surface No method the Gait family owns; the drill rows are runtime data.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the march and double time are not declared a second time.
 */
export interface IAutoMovieMotionHumanMilitaryDrill<
  Chain,
> extends IAutoMovieMotionHumanGaitStyled<Chain> {}
