/**
 * The bind's thumb, a pose convention like the fingers': each phalanx's
 * direction in the hand's frame on its knuckles as `[spread, flexion]` in
 * degrees, spread from the hand's axis toward the thumb's side, then flexion
 * toward the palm (`AutoMovieHumanHandPosture.THUMB` holds the numbers and
 * their basis).
 */
export interface IAutoMovieHumanHandThumbPosture {
  /** The proximal phalanx, MCP to IP: `[spread, flexion]`, degrees. */
  proximal: readonly number[];

  /** The distal phalanx, IP to the tip: `[spread, flexion]`, degrees. */
  distal: readonly number[];
}
