/** Surface pole closing a chain end. */
export interface IAutoMovieHumanSurfacePole {
  /** Chain whose end the pole closes. */
  chain: string;

  /** Which end of the chain. */
  end: "top" | "bottom";

  /**
   * Pole point `[x, y, z]` in registered-frame millimetres. A critical pole may
   * be recovered or constructed; provisional closures use the chain's axis
   * point at the corresponding end.
   */
  point: [number, number, number];

  /**
   * Whether the producer designates a critical pole rather than a provisional
   * closure.
   */
  critical: boolean;
}
