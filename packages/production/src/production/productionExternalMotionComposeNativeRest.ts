
import { IAutoMovieQuaternion, IAutoMovieVector3, IAutoMovieSkeleton } from "@automovie/interface";

/**
 * Compose the existing parent/local rest recipe in translation, quaternion and component scale form.
 *
 * Local translation is parent-scaled and parent-rotated before adding parent translation; rotations use the Hamilton product and scales multiply by component. The rotation formula assumes unit quaternions; model admission permits a 1e-6 norm tolerance without normalizing, so exact geometric rotation is not independently established here. Rotated nonuniform scales can introduce shear that this TRS representation does not retain.
 *
 * @evidence contracts/common.md#principled-implementation Quaternion-vector cross products and Hamilton multiplication implement the established TRS recipe using ordinary double precision. This helper adds no normalization, tolerance or full matrix decomposition; exact native comparison inherits arithmetic rounding and representation limits.
 * @evidence contracts/common.md#clear-and-simple-design The helper-collapse walk owns order and hierarchy; this internal numeric operation owns only one rest-composition step.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture bone, measured pose or expected answer receives an exception. The representation's shear limitation is explicit rather than compensated by epsilon equality or a fabricated clinical guarantee.
 * @evidence contracts/common.md#meaningful-documentation States translation/rotation/scale order, finite/unit-quaternion premises, the prior norm tolerance without normalization, new result ownership and double-precision/shear limits.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of scalar arithmetic operations allocates a few vector/quaternion/rest records per step; the owning chain traversal multiplies that work by actual helper depth.
 * @evidence contracts/performance.md#reuse-equivalent-work Each step depends on its current parent/local values and is recomputed; no equivalent-rest cache assumes borrowed input objects remain unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The newly allocated rest result transfers to the chain accumulator and temporaries expire locally. No retained graph, native handle or running task is owned.
 */
export function productionExternalMotionComposeNativeRest(parent: IAutoMovieSkeleton["bones"][number]["rest"], local: IAutoMovieSkeleton["bones"][number]["rest"]): IAutoMovieSkeleton["bones"][number]["rest"] {
  const scaled: IAutoMovieVector3 = {
    x: local.translation.x * parent.scale.x,
    y: local.translation.y * parent.scale.y,
    z: local.translation.z * parent.scale.z,
  };
  const q: IAutoMovieQuaternion = parent.rotation;
  const uv: IAutoMovieVector3 = {
    x: q.y * scaled.z - q.z * scaled.y,
    y: q.z * scaled.x - q.x * scaled.z,
    z: q.x * scaled.y - q.y * scaled.x,
  };
  const uuv: IAutoMovieVector3 = {
    x: q.y * uv.z - q.z * uv.y,
    y: q.z * uv.x - q.x * uv.z,
    z: q.x * uv.y - q.y * uv.x,
  };
  const rotated: IAutoMovieVector3 = {
    x: scaled.x + 2 * (q.w * uv.x + uuv.x),
    y: scaled.y + 2 * (q.w * uv.y + uuv.y),
    z: scaled.z + 2 * (q.w * uv.z + uuv.z),
  };
  const a: IAutoMovieQuaternion = parent.rotation;
  const b: IAutoMovieQuaternion = local.rotation;
  return {
    translation: {
      x: parent.translation.x + rotated.x,
      y: parent.translation.y + rotated.y,
      z: parent.translation.z + rotated.z,
    },
    rotation: {
      x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
      y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
      z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
      w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    },
    scale: {
      x: parent.scale.x * local.scale.x,
      y: parent.scale.y * local.scale.y,
      z: parent.scale.z * local.scale.z,
    },
  };
}
