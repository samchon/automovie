import { followPathMotion, sampleMotion } from "@automovie/engine";
import { IAutoMovieJointPose, IAutoMovieKeyframe, IAutoMovieMotion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

const kf: (time: number, flexion: number) => IAutoMovieKeyframe = (time: number, flexion: number): IAutoMovieKeyframe => ({
  time,
  pose: {
    skeleton: "s",
    root: null,
    joints: [{ bone: "leftLowerArm", flexion, abduction: null, twist: null }],
  },
  expression: null,
  easing: "linear",
  bezier: null,
});

/** A seamless triangle cycle: flexion 0 → 120 → 0 over 1 s. */
const gait: IAutoMovieMotion = {
  id: "swing",
  skeleton: "s",
  duration: 1,
  loop: true,
  keyframes: [kf(0, 0), kf(0.5, 120), kf(1, 0)],
};

const flexionAt: (motion: IAutoMovieMotion, time: number) => number = (motion: IAutoMovieMotion, time: number): number =>
  sampleMotion(motion, time).pose.joints.find((j: IAutoMovieJointPose): boolean => j.bone === "leftLowerArm")!
    .flexion!;

/**
 * Observe retained limb phase across an L-path corner by sampling an authored triangular flexion cycle before and after the turn. This samples the numerical bake through sampleMotion; it does not establish rendered continuity or every intermediate time.
 *
 * Scenarios (the L-path corner falls at t=2, mid-timeline):
 *
 * 1. Just before the corner (t=1.75, phase 0.75) the flexion equals the base
 *    cycle's 60°, and just after (t=2.25, phase 0.25) it is 60° again: the
 *    swing marches straight through the turn with no reset.
 * 2. At an exact keyframe past the corner (t=2.5, phase 0.5) the flexion is the
 *    base peak 120°.
 * 3. The same phase sampled in the first cycle (t=0.25) matches the phase sampled
 *    after the corner (t=2.25): cycle N and cycle N+2 agree.
 *
 * @evidence contracts/testing.md#behavioral-verification Bakes the path and samples lower-arm flexion either side of the corner, at the later peak and at equal phases in different cycles, detecting phase restart or clock displacement during root steering.
 * @evidence contracts/testing.md#independent-expectations The unchanged linear triangle 0 to 120 to 0 over one second gives literal 60 at phases 0.25 and 0.75 and 120 at phase 0.5. The cross-cycle comparison alone could share a wrong value, so the literal samples independently constrain it; sampleMotion is the consumer under observation, not a separate oracle.
 * @evidence contracts/testing.md#distinguishing-cases Preserves pre-corner 1.75, post-corner 2.25, exact later key 2.5 and first-cycle 0.25 with the original tolerances. Root geometry, corner heading and contact are owned by the adjacent path and planting units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns its direct path bake and sample calls with an in-memory cycle. Private keyframe/flexion readers register no cases and start no renderer, viewer or process.
 */
export function test_motion_path_phase_continuity(): void {
  const path: ReturnType<typeof followPathMotion> = followPathMotion({
    id: "walk-swing",
    gait,
    waypoints: [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 2, y: 0, z: 2 },
    ],
    speed: 1,
    turnWindow: 1,
  });

  TestValidator.predicate(
    "phase 0.75 before the corner",
    nclose(flexionAt(path.motion, 1.75), 60),
  );
  TestValidator.predicate(
    "phase 0.25 after the corner",
    nclose(flexionAt(path.motion, 2.25), 60),
  );
  TestValidator.predicate(
    "base peak at the keyframe past the corner",
    nclose(flexionAt(path.motion, 2.5), 120),
  );
  TestValidator.predicate(
    "first cycle and post-corner cycle agree at equal phase",
    nclose(flexionAt(path.motion, 0.25), flexionAt(path.motion, 2.25)),
  );
}
