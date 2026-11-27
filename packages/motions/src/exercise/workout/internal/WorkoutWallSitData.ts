import type { AutoMovieHumanoidBone } from "@automovie/interface";

export namespace WorkoutWallSitData {
  /*
   * The torso bones whose exterior can carry wall reaction.
   */
  export const TORSO: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "hips",
    "spine",
    "chest",
  ]);
}
