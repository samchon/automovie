/**
 * Vertical body-mass oscillation attached to a gait cycle. `gaitMotion`
 * evaluates `center + amplitude * sin(2 * PI * cycle)` on local Y at each bake
 * sample, with identity rotation and scale; absent rootBob leaves the root
 * unauthored. The resulting clip linearly interpolates those root samples
 * during playback.
 */
export interface IAutoMovieGaitRootBob {
  /** Finite signed peak displacement from center, in metres. */
  amplitude: number;

  /** Finite cycle offset in turns; normalized modulo one during synthesis. */
  phase: number;

  /** Finite neutral vertical translation, in metres. */
  center: number;
}
