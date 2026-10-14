import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
} from "@automovie/interface";

/**
 * State one named humanoid joint's authored degree angles, filling omitted axes with zero. Zero is a semantic angle interpreted through the page's joint axes/rest-frame mapping, not proof of the skeleton's geometric T-pose or clinical capacity.
 *
 * @evidence contracts/common.md#principled-implementation Closed bone identity and independent angle axes preserve the authored motion AST; nullish omission fills only absent angles and retains explicit numeric values unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One literal constructor supplies the current clip vocabulary without owning IK, clamping, interpolation or rendering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero omission is a choreography convention, not guessed physiology; finite values/ROM and compatible rig are not validated by this constructor.
 * @evidence contracts/common.md#meaningful-documentation The comment states degrees, omitted-axis behavior and semantic versus geometric/clinical limits.
 * @evidence contracts/performance.md#efficient-algorithms Three scalar defaults and one joint record require constant work/storage; full clip construction and sampling remain caller/engine costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call creates mutable authored data and retains no numerical or record cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned joint record is caller-owned and no handle, timer, worker or cross-call state is retained.
 *
 * @author Samchon
 */
export function createStickmanMotionJoint(
  bone: AutoMovieHumanoidBone,
  angles: {
    /** Authored flexion in degrees; omission means zero semantic flexion. */
    flexion?: number;

    /** Authored abduction in degrees; omission means zero semantic abduction. */
    abduction?: number;

    /** Authored axial twist in degrees; omission means zero semantic twist. */
    twist?: number;
  },
): IAutoMovieJointPose {
  return {
    bone,
    flexion: angles.flexion ?? 0,
    abduction: angles.abduction ?? 0,
    twist: angles.twist ?? 0,
  };
}
