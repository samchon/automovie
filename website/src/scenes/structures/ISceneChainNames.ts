/**
 * The exported names the code a scene's page shows refers to, read from
 * the installed packages when the site is built.
 */
export interface ISceneChainNames {
  /** Each lexicon row and exported law by name, as the expression that names its law, such as `HumanHabit.ashTap`; a vocabulary action is not listed. */
  rows: Record<string, string>;

  /** Each mutual record by name, as the expression that names it, such as `HumanSocial.toast`. */
  mutuals: Record<string, string>;

  /** The archetype producers whose variants are frames, so they take `frame` where the others take `kind`. */
  frames: string[];

  /** The laws the performance registers for the scene, as the expressions that name them, in the order the chain meets them. */
  laws: string[];
}
