export namespace HumanBikeGuideData {
  /*
   * Path samples per second of the bicycle's course read at planning, Hz.
   */
  export const RATE: number = 60;

  /*
   * The guiding station's root outward of the grip, metres: provisional, a
   * shoulder's reach beside the handlebar.
   */
  export const STATION: number = 0.15;

  /*
   * The guiding station's root behind the grip, metres: provisional.
   */
  export const BEHIND: number = 0.1;

  /*
   * Seconds to move from the entered place to the guiding station: provisional.
   */
  export const ADJUST: number = 0.8;

  /*
   * Seconds the hand takes to reach the grip: it closes as the athlete arrives at
   * the station.
   */
  export const REACH: number = ADJUST;
}
