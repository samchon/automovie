/*
 * The take-off's rise above the horizontal at a run-up speed, degrees: the
 * regression over an athlete's run-ups from 4.5 to 8.5 m/s, `48.8 - 3.51 v`
 * (Linthorne and Weetman 2012, "Effects of run-up velocity on performance,
 * kinematics, and energy exchanges in the pole vault", J. Sports Sci. Med.
 * 11:245-254), about 19 degrees at a competition run-up of 8.4 m/s.
 * Parameter speed: The run-up speed, m/s.
 * Returns: Degrees above the horizontal.
 */
export function poleVaultTakeoffAngle(speed: number): number {
  return 48.8 - 3.51 * speed;
}
