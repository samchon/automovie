export namespace ConductData {
  /*
   * The rebound's height between ictuses, as a share of `conductFigure.HALF`:
   * provisional, above the largest rise between ictuses times 1/π so each ictus
   * is a lowest point.
   */
  export const REBOUND: number = 0.6;

  /*
   * The share of the lead before the first beat the arm takes to reach the
   * figure: the rest of the lead is the preparatory arc into the first ictus,
   * which the figure holds, as a conductor's preparation is part of the beat
   * (provisional).
   */
  export const PREP: number = 0.25;

  /*
   * The tempo when none is given, beats per minute.
   */
  export const BPM: number = 120;
}
