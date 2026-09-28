import type {
  AutoMovieHumanoidBone,
  IAutoMovieModel,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Everything one evaluation of a body document produces.
 *
 * The face builder returns a model alone because a face has no rig. A body
 * evaluation also settles where the joints ended up, and the tools that check
 * it (rigid-segment residuals, arc versus chord, range comparisons) need those
 * transforms rather than re-deriving them from the skin. `model` is the posed,
 * skinned static model the viewer draws and the static exporter accepts: its
 * parts carry no bone bindings and it has no skeleton, because the pose has
 * already been applied. `skeleton` is the rest skeleton of the shaped body,
 * and `bones` pairs each joint's rest and posed world transforms.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Exposes the rest and posed joint transforms so a consumer can verify that skinned vertices followed their bone's arc.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Returns the rest skeleton and per-bone world transforms the skinning formula composed.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBuild {
  /** Posed static model: skinless parts, no skeleton, validated as a resident model. */
  model: IAutoMovieModel;

  /** Rest skeleton of the shaped body, before the document's pose. */
  skeleton: IAutoMovieSkeleton;

  /** Rest and posed world transforms per joint, in the basis frame. */
  bones: {
    bone: AutoMovieHumanoidBone;
    rest: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
    posed: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
  }[];

  /** Shaped landmark positions by id, after channels and correctives. */
  landmarks: Record<string, IAutoMovieVector3>;
}
