/** Clinical axis targets in degrees used to construct a recoil pose. */
export interface IAutoMovieRecoilPush {
  /** Flexion target in degrees; absent or zero authors no flexion response. */
  flexion?: number;

  /** Abduction target in degrees; absent or zero authors no abduction response. */
  abduction?: number;

  /** Twist target in degrees; absent or zero authors no twist response. */
  twist?: number;
}
