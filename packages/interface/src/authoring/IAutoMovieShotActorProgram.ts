/** Host-compilable runtime facts for one actor in a thin shot program. */
export interface IAutoMovieShotActorProgram {
  /** Staged actor node whose actions these facts support. */
  node: string;

  /**
   * Compiler-owned runtime model id providing the skeleton and gait profiles.
   */
  model: string;

  /** Finite positive locomotion speed in world meters per second. */
  speed: number;

  /** Finite non-negative eye height above the staged root, in meters. */
  eyeHeight: number;
}
