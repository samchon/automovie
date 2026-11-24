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
    /** AAOS active flexion range at the finger MCP, degrees. */
    fingerMcp: number;
    /** AAOS active flexion range at the finger PIP, degrees. */
    fingerPip: number;
    /** AAOS active flexion range at the thumb MCP, degrees. */
    thumbMcp: number;
    /** AAOS active flexion range at the thumb IP, degrees. */
    thumbIp: number;
  };

  /** Thumb bind turns toward the palm, in degrees from each incoming segment. */
  export type IThumbRestResult = {
    /** Thumb MCP rest flexion, degrees. */
    mcp: number;
    /** Thumb interphalangeal rest flexion, degrees. */
    ip: number;
  };
}
