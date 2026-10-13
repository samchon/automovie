import type { AutoMovieHumanBodyBoneId } from "../anatomy/identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodyBoneTransform } from "../structures/rig/IAutoMovieHumanBodyBoneTransform";

/**
 * An original anatomical graph key and its returned rest/posed world frames.
 * Positions remain metres in the body basis; the origin denotes the graph's
 * placement frame rather than a measured joint centre or bone surface.
 *
 * @author Samchon
 */
export interface IConnectedBodyAnatomicalBoneReading extends IAutoMovieHumanBodyBoneTransform {
  /** Actual anatomical identity from the evaluated graph. */
  bone: AutoMovieHumanBodyBoneId;
}
