/** A person's independently specified left and right instances of one part. */
export interface IAutoMovieHumanPair<T> {
  /** The person's left instance. */
  left: T;

  /** The person's right instance. */
  right: T;
}
