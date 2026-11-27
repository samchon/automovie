import type { IAutoMovieMotionHumanCollapse } from "@automovie/interface";

export namespace CollapseFoldData {
  /*
   * Each direction's angles, degrees (provisional stage readings).
   */
  export const SHAPES: Readonly<
    Record<Exclude<IAutoMovieMotionHumanCollapse.Direction, "backward">, IShape>
  > = {
    forward: {
      hip: 70,
      knee: 105,
      pitch: 15,
      lyingHip: 5,
      lyingKnee: 10,
      lyingPitch: 75,
      roll: 0,
    },
    sideways: {
      hip: 60,
      knee: 95,
      pitch: 10,
      lyingHip: 10,
      lyingKnee: 15,
      lyingPitch: 0,
      roll: 92,
    },
    inPlace: {
      hip: 95,
      knee: 130,
      pitch: 30,
      lyingHip: 110,
      lyingKnee: 140,
      lyingPitch: 25,
      roll: 0,
    },
  };

  /*
   * The sag's knee softening and trunk sway, degrees (provisional).
   */
  export const SAG: Readonly<ISAGItem> = { knee: 15, pitch: 4 };

  /*
   * The arms of each tone, degrees (provisional): a protective reach toward the
   * floor and its brace, a limp arm hanging.
   */
  export const ARMS: Readonly<IARMSItem> = {
    reach: 100,
    ahead: 0,
    sweep: 90,
    yield: 10,
    brace: 50,
    open: 10,
    elbow: 15,
    limp: 5,
    limpElbow: 10,
    neck: 30,
  };

  /*
   * The record of `IARMSItem`'s site.
   */
  export type IARMSItem = {
    reach: number;
    ahead: number;
    sweep: number;
    yield: number;
    brace: number;
    open: number;
    elbow: number;
    limp: number;
    limpElbow: number;
    neck: number;
  };

  /*
   * The record of `ISAGItem`'s site.
   */
  export type ISAGItem = { knee: number; pitch: number };

  /*
   * One direction's kneeling and lying angles, degrees.
   */
  export interface IShape {
    /*
     * Hip flexion on the knees.
     */
    hip: number;
    /*
     * Knee flexion on the knees.
     */
    knee: number;
    /*
     * Trunk pitch reached by the drop.
     */
    pitch: number;
    /*
     * Hip flexion lying.
     */
    lyingHip: number;
    /*
     * Knee flexion lying.
     */
    lyingKnee: number;
    /*
     * Trunk pitch added by the lay.
     */
    lyingPitch: number;
    /*
     * Trunk roll reached by the lay toward the fall's side.
     */
    roll: number;
  }
}
