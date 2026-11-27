export namespace CrossingClearanceData {
  /*
   * Depth a segment that does not bear on a fixture may enter it, metres
   * (provisional: under the audits' built skin give,
   * `AutoMovieMotionHumanAuditSkin.BUILT`).
   */
  export const ROOM: number = 0.007;

  /*
   * Depth a hand or foot bearing on the fixture may enter it, metres
   * (provisional: a loaded sole or palm pressed into its support).
   */
  export const CONTACT: number = 0.02;
}
