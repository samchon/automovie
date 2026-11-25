/** One inspected animation take addressable inside an external motion asset. */
export interface IAutoMovieExternalMotionTake {
  /** Stable take id within this asset record. */
  id: string;

  /** Zero-based glTF animation index. */
  animationIndex: number;

  /** Source-authored animation name, or null when unnamed. */
  sourceName: string | null;

  /** Inspected finite duration in seconds. */
  durationSeconds: number;
}
