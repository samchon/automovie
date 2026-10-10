import type { AutoMovieHumanBodyBoneId } from "@automovie/human/body/anatomy/identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodyBoneTransform } from "@automovie/human/body/structures/rig/IAutoMovieHumanBodyBoneTransform";

/**
 * An original anatomical graph key and its returned rest/posed world frames.
 * Positions remain metres in the body basis; the origin denotes the graph's
 * placement frame rather than a measured joint centre or bone surface.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Keeps the evaluated anatomical identity beside the body's returned placement frames for inspection.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Names one actual graph entry in the same worker result as its evaluated body.
 * @author Samchon
 */
export interface IConnectedBodyAnatomicalBoneReading extends IAutoMovieHumanBodyBoneTransform {
  /** Actual anatomical identity from the evaluated graph. */
  bone: AutoMovieHumanBodyBoneId;
}
