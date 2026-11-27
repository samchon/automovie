import type { IAutoMovieMotionHumanTendHorse } from "@automovie/interface";

/*
 * Tasks whose hand closes on what it holds; the others lay the hand on a
 * surface.
 */
export const GRIPPED: ReadonlySet<IAutoMovieMotionHumanTendHorse.Task> =
  new Set<IAutoMovieMotionHumanTendHorse.Task>(["lead", "hoof"]);

/*
 * The displayed hand's largest distance from its contact while fully held,
 * metres: the rider attachment contract's 10 mm budget.
 */
export const CONTACT: number = 0.01;
