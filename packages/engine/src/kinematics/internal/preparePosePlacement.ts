import type {
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { PoseResolutionSnapshot } from "../PoseResolutionSnapshot";

/** Private operation placement; neither this state nor its operands may escape. */
interface IPlacement {
  /** Owned quaternion, never mutated after selection. */
  rootRotation: IAutoMovieQuaternion;

  /** Owned metre translation, never mutated after selection. */
  rootTranslation: IAutoMovieVector3;

  /** Revision advanced only after an actual exact placement change. */
  rootRevision: number;
}

/**
 * Snapshot current root placement into one private prepared-FK operation.
 * Translation and rotation references are read in raw FK order; exact scalar
 * comparisons then select existing private operands or copy changed values. The
 * supplied identity/origin are that same rig state's fixed defaults.
 */
export function preparePosePlacement(
  state: IPlacement,
  pose: Pick<IAutoMoviePose, "root">,
  identity: IAutoMovieQuaternion,
  origin: IAutoMovieVector3,
): void {
  const translation: IAutoMovieVector3 = pose.root?.translation ?? origin;
  const rotation: IAutoMovieQuaternion = pose.root?.rotation ?? identity;
  const sameRotation: boolean = PoseResolutionSnapshot.sameQuaternion(
    state.rootRotation,
    rotation,
  );
  const sameTranslation: boolean = PoseResolutionSnapshot.sameVector(
    state.rootTranslation,
    translation,
  );
  if (sameRotation && sameTranslation) return;
  const nextRotation: IAutoMovieQuaternion = sameRotation
    ? state.rootRotation
    : PoseResolutionSnapshot.sameQuaternion(identity, rotation)
      ? identity
      : copyQuaternion(rotation);
  const nextTranslation: IAutoMovieVector3 = sameTranslation
    ? state.rootTranslation
    : PoseResolutionSnapshot.sameVector(origin, translation)
      ? origin
      : copyVector(translation);
  state.rootRotation = nextRotation;
  state.rootTranslation = nextTranslation;
  ++state.rootRevision;
}

/**
 * Copy exact changed root components; only the owning operation can reach the
 * result.
 */
function copyQuaternion(input: IAutoMovieQuaternion): IAutoMovieQuaternion {
  return { x: input.x, y: input.y, z: input.z, w: input.w };
}

/** Copy exact changed root metres in the original property order. */
function copyVector(input: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: input.x, y: input.y, z: input.z };
}
