import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";

/** Source sites defining the existing hips-only pelvic rhythm inside the anatomical graph. */
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
