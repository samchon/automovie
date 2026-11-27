export namespace BackToBackData {
  /*
   * The most a seated trunk leans back, degrees: the normal thoracolumbar
   * extension, 25 degrees (Physiopedia, Range of Motion Normative Values,
   * https://www.physio-pedia.com/Range_of_Motion_Normative_Values), as
   * `headRestAim.SEATED` bounds its side lean.
   */
  export const BACK: number = 25;

  /*
   * How near the upper back comes to the meeting point, metres (provisional: a
   * skin contact, as `headRest`'s).
   */
  export const NEAR: number = 0.01;
}
