import type { AutoMovieHumanoidBone } from "@automovie/interface";

/** One solver axis's authored and shaped-rest angles, degrees. */
export interface IBodyCorrectiveAxis {
  bone: AutoMovieHumanoidBone;
  axis: "flexion" | "abduction" | "twist";
  angle: number;
  rest: number;
}
