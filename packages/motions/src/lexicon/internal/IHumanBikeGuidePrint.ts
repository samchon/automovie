import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * One planted footprint: where and how the foot stands, and from when.
 */
export interface IHumanBikeGuidePrint {
  /*
   * Seconds of the action at which the foot lands; 0 for the entered footprint.
   */
  land: number;

  /*
   * Seconds at which it lifts for its next step; the end when it stays.
   */
  lift: number;

  /*
   * World ankle position, metres.
   */
  ankle: IAutoMovieVector3;

  /*
   * World foot rotation.
   */
  rotation: IAutoMovieQuaternion;
}
