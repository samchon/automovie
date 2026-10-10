/**
 * A one-skin person's posed skin halves and what the two partitions asked of
 * the shared boundary.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonFormedSkin {
  /** Posed head skin positions. */
  facePosed: number[];

  /** Posed body skin positions. */
  bodyPosed: number[];

  /** The largest face field step at a shared sample, metres. */
  faceField: number;

  /** The largest body field step at a shared sample beyond the head carry, metres. */
  bodyField: number;
}
