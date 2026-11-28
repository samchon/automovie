/** One local metre coordinate pair for authored construction profiles. */
export interface IAutoMovieProfilePoint {
  /**
   * First finite profile coordinate in metres, interpreted as local X,
   * section-axis distance or radius by the consumer.
   */
  x: number;

  /**
   * Second finite profile coordinate in metres, interpreted as local Y,
   * section-axis distance or height by the consumer.
   */
  y: number;
}
