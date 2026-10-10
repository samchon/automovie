import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * One existing source coupling's scalar degree addition, kept separate from final post-pelvis clinical coordinates.
 *
 * @author Samchon
 */
export interface IHumanBodyCouplingContribution {
  /** Source coupling identity. */
  coupling: string;

  /** Existing rig bone receiving the addition. */
  bone: AutoMovieHumanoidBone;

  /** Existing degree axis receiving the addition. */
  axis: "flexion" | "abduction" | "twist";

  /** Existing signed scalar increment, degrees. */
  degrees: number;
}
