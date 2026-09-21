import { IAutoMovieSpringState } from "./IAutoMovieSpringState";

/**
 * A fresh, empty spring state.
 *
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Creates the explicit initial state owned by the live spring solver.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Initializes the deterministic live-secondary evaluation path.
 */
export const createSpringState = (): IAutoMovieSpringState => ({
  prev: new Map(),
  centers: new Map(),
  sprung: new Map(),
});
