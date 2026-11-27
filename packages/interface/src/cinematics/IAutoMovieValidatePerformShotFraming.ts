/** Independent vocabulary-admission flags for framing and movement. */
export namespace IAutoMovieValidatePerformShotFraming {
  /**
   * Fresh mutable result of checking membership in the camera framing and
   * movement vocabularies.
   *
   * The values are `unknown` because a `frame` action and a blocking coverage
   * intent reach `performShot` in-process without the transport's structural
   * gate. Each unknown value is one `type` violation at `<path>.framing` or
   * `<path>.move` listing the accepted values, the members of
   * {@link AutoMovieEngineCameraFramings} and {@link AutoMovieEngineCameraMoves} in declaration order.
   *
   * A refused value whose string conversion throws is described as `an
   * uninspectable value`; its original reference remains in the finding and the
   * other vocabulary is still checked.
   */
  export type IResult = {
    /**
     * True exactly when the original framing value belongs to AutoMovieEngineCameraFramings;
     * false also appends a framing type violation.
     */
    framed: boolean;

    /**
     * True exactly when the original movement value belongs to AutoMovieEngineCameraMoves;
     * checked even if framing failed.
     */
    moved: boolean;
  };
}
