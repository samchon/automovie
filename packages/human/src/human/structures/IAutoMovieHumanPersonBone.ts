import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanPersonBoneFrames } from "./IAutoMovieHumanPersonBoneFrames";

/**
 * One assembled humanoid bone identity with canonical rest/posed world frames in common metre Y-up/+Z-forward coordinates. These actual evaluator frames support rig readings and skin transport; naming a bone does not prove clinical joint registration, source acquisition or current displayed anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Closed humanoid bone identity pairs the inherited actual rest and posed frame records used by assembled skin/rig consumers.
 * @evidence contracts/common.md#clear-and-simple-design The frame-pair owner supplies coordinates/orientations while this record adds only canonical bone identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A bone label does not invent unavailable transforms, patient joint geometry or a visual registration result.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies common metre/world frame and source/clinical qualification boundaries of rig metadata.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This named frame carrier performs no rig resolution or skin transform calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Sharing assembled frames is evaluator behavior rather than caching implemented by this identity record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring bone metadata acquires no skeleton resource or task; containing build records own actual frame lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBone extends IAutoMovieHumanPersonBoneFrames {
  /** The humanoid bone name. */
  bone: AutoMovieHumanoidBone;
}
