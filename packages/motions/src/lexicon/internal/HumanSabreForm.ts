/*
 * The sabre stroke's form: the stride, the reach and the clearances the mounted
 * cut is laid by.
 */
export namespace HumanSabreForm {
  /*
   * The longest a gallop stride lasts, seconds, the most a charge may take to
   * come to the engage (provisional: a gallop of about two strides a second).
   */
  export const STRIDE: number = 0.5;

  /*
   * The share of the arm's full length the engage reaches forward, short of the
   * straight elbow's singular reach (provisional).
   */
  export const REACHED: number = 0.95;

  /*
   * How far ahead along the seat's forward the engage points when no target is
   * named, metres: far enough that the shoulder's own offset leaves the line
   * level and straight ahead.
   */
  export const FAR: number = 10;

  /*
   * Seconds the arms take from the entry to the bridle and the carriage
   * (provisional).
   */
  export const REACH: number = 0.5;

  /*
   * How far in front of the shoulder joint the slope's blade lies, metres: the
   * shoulder's skin, which the back of the blade rests on (provisional).
   */
  export const SKIN: number = 0.06;
}
