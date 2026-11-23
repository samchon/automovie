/** One carried-bound contact over an ordered camera sample interval. */
export interface IAutoMovieCameraClearanceFinding {
  /** Camera or parent-rig envelope that contacted scene geometry. */
  part: "body" | "parent-rig";

  /** Stable scene-node identity whose current bound was contacted. */
  obstacle: string;

  /** Inclusive shot-local interval start in seconds. */
  start: number;

  /** Inclusive shot-local interval end in seconds. */
  end: number;
}
