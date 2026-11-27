export namespace JumpPushData {
  /*
   * The slowest descent of a reaching-foot sole point that counts as falling,
   * metres per second: slower, the foot is turning about that point
   * (provisional).
   */
  export const PIVOTING: number = 0.01;

  /*
   * The shortest carry, seconds, whose carried-rate term is evaluated: a
   * microsecond carry adds nothing a frame shows, and the term divides by its
   * duration.
   */
  export const CARRY: number = 1e-6;
}
