import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";

/**
 * Source sites defining the existing hips-only pelvic rhythm inside the anatomical graph.
 *
 * @evidence contracts/common.md#principled-implementation A registered pelvic member set and bilateral hip sites define hips-only rotation while trunk and femur world frames remain unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One registration record groups pelvis identity, rigid-ring members and the two source-local endpoints used by pelvic rhythm.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual source sites supply the rotation line; a skin-derived or independently invented hip centre is not substituted.
 * @evidence contracts/common.md#meaningful-documentation Comments define member uniqueness intent, pelvis inclusion, unchanged neighboring frames, bilateral site ownership and source registration account.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Pelvic registration data identifies a rotation line but does not resolve or rotate member frames.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A member/site account defines source dependency rather than reuse of prior rhythm evaluations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The pelvic record owns no per-frame transform cache or running coordination task.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourcePelvicRhythm {
  /** Source bone corresponding to the public pelvis projection. */
  pelvis: AutoMovieHumanBodyBoneId;

  /** Actual rigid pelvic-ring members carried together; trunk and femur world frames remain unchanged. Must include pelvis. */
  members: readonly AutoMovieHumanBodyBoneId[];

  /** Source bone carrying the left registered hip centre. */
  leftHipBone: AutoMovieHumanBodyBoneId;

  /** Left source-local named site; resolved world position supplies the line endpoint. */
  leftHipSite: string;

  /** Source bone carrying the right registered hip centre. */
  rightHipBone: AutoMovieHumanBodyBoneId;

  /** Right source-local named site; resolved world position supplies the line endpoint. */
  rightHipSite: string;

  /** Registration of source sites to the basis's bilateral hip centres. */
  account: string;
}
