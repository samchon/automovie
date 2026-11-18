import type {
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { PoseResolutionSnapshot } from "./PoseResolutionSnapshot";

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
 * comparisons then select existing private operands or copy changed values.
 * The supplied identity/origin are that same rig state's fixed defaults.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines root-null defaults, reference/component order, model-metre translation, exact revisions and private immutable-by-ownership operands without scale or numerical admission.
 * @evidence contracts/development/implementation.md#principled-implementation Copies the actual x/y/z/w quaternion and x/y/z translation without normalization or arithmetic. Object.is comparisons preserve NaN and signed-zero distinctions. Both next operands are obtained before committing either; root/rest scale stays unused and the prepared FK owner retains its original parent-first products.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns only dynamic placement snapshot/revision. PoseResolutionSnapshot owns exact comparisons and static frozen rig copies; the state owner controls admission, hierarchy and fresh output copying. Local copy helpers preserve structural callable/inherited fields without exposing a copying option or admission marker.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance, pose identity, mutable-input identity certificate, target answer or invalid-value repair substitutes for current reads. Malformed non-record values retain the former deferred consuming behavior, and no scale or reassociation is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant comparisons precede at most one quaternion and one vector copy per changed placement. Owned private values are never mutated or exposed, so dynamic copies need no per-change Object.freeze; unchanged and exact default operands allocate nothing. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact current component equality alone selects prior owned operands or actual fixed identity/origin. Changed roots advance the existing revision and invalidate placed FK normally; no whole-pose, time or result cache is created.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Placement state owns one current quaternion/translation pair and revision; existing bounded FK rows may still borrow older operands until those rows update or the operation releases. Copies never escape through public frames, whose nested values are independently copied. This helper retains no raw pose, transform, result history, handle or task after return.
 */
export function preparePosePlacement(
  state: IPlacement,
  pose: Pick<IAutoMoviePose, "root">,
  identity: IAutoMovieQuaternion,
  origin: IAutoMovieVector3,
): void {
  const translation: IAutoMovieVector3 = pose.root?.translation ?? origin;
  const rotation: IAutoMovieQuaternion = pose.root?.rotation ?? identity;
  const sameRotation: boolean = PoseResolutionSnapshot.sameQuaternion(state.rootRotation, rotation);
  const sameTranslation: boolean = PoseResolutionSnapshot.sameVector(state.rootTranslation, translation);
  if (sameRotation && sameTranslation) return;
  const nextRotation: IAutoMovieQuaternion = sameRotation ? state.rootRotation
    : PoseResolutionSnapshot.sameQuaternion(identity, rotation) ? identity : copyQuaternion(rotation);
  const nextTranslation: IAutoMovieVector3 = sameTranslation ? state.rootTranslation
    : PoseResolutionSnapshot.sameVector(origin, translation) ? origin : copyVector(translation);
  state.rootRotation = nextRotation;
  state.rootTranslation = nextTranslation;
  ++state.rootRevision;
}

/** Copy exact changed root components; only the owning operation can reach the result. */
function copyQuaternion(input: IAutoMovieQuaternion): IAutoMovieQuaternion {
  return !hasProperties(input) ? input : { x: input.x, y: input.y, z: input.z, w: input.w };
}

/** Copy exact changed root metres in the original property order. */
function copyVector(input: IAutoMovieVector3): IAutoMovieVector3 {
  return !hasProperties(input) ? input : { x: input.x, y: input.y, z: input.z };
}

/** Keep malformed non-record values and callable structural records unchanged in kind. */
function hasProperties(input: unknown): boolean {
  return (typeof input === "object" && input !== null) || typeof input === "function";
}
