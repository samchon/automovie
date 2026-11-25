/**
 * Type contracts exchanged by AutoMovieHumanHandPosture; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanHandPosture {
  /**
   * Flexion ranges, degrees, AAOS (`docs/anatomy/joint-range.md`): finger MCP,
   * finger PIP, thumb MCP, thumb IP.
   */
  export type IRange = {
    /**
     * AAOS active flexion range at the finger mcp, degrees; the resting posture
     * uses the observed resting share of this range.
     */
    fingerMcp: number;
    /**
     * AAOS active flexion range at the finger pip, degrees; the resting posture
     * uses the observed resting share of this range.
     */
    fingerPip: number;
    /**
     * AAOS active flexion range at the thumb mcp, degrees; the resting posture
     * uses the observed resting share of this range.
     */
    thumbMcp: number;
    /**
     * AAOS active flexion range at the thumb ip, degrees; the resting posture
     * uses the observed resting share of this range.
     */
    thumbIp: number;
  };

  /**
   * Result of AutoMovieHumanHandPosture.thumbRest. The thumb's resting flexion
   * at its two joints, degrees, each about its own bone toward the palm: the
   * relaxed hand rests every digit at the same share of its joints' ranges, so
   * the thumb's MCP and IP take the fingers' observed mean resting share of
   * their MCP and PIP ranges ({@link FINGERS} over {@link RANGE}, four reference
   * bodies) times their own ranges. The one reference thumb walked alone (f1)
   * reads its proximal phalanx at about 22 degrees from the hand's axis; a
   * single reading is no rule, so it is a check and not an input.
   */
  export type IThumbRestResult = {
    /** Thumb MCP rest flexion, degrees. */
    mcp: number;
    /** Thumb interphalangeal rest flexion, degrees. */
    ip: number;
  };
}
