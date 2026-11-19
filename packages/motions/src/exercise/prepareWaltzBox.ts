import { minimumJerk, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanDance,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";

/**
 * Prepare the optional waltz box's common clock, turning placements and
 * vertical excursion. Yoshida et al. (2022, DOI 10.3389/fspor.2022.941042)
 * observed role-dependent rotation in a closed-hold spin. This figure
 * rotates the dancer through whichever angle the score gives them; the
 * modest excursion of the pelvis is provisional.
 *
 * @param options The pivot and signed turn for this dancer's figure.
 * @param origin The dancer's starting root in world metres.
 * @param metre The dancer's stature in metres.
 * @param beatPeriod The nominal seconds between beats.
 * @param firstBeat The first beat's second, local to the action.
 * @param lastBeat The last beat's second, local to the action.
 * @param duration The duration including the exit beat, in seconds.
 * @returns The timed placement, heading change and lowering from standing height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, rhythm, rotation source and authored values.
 * @evidence contracts/development/implementation.md#principled-implementation Fixed floor targets rotate about an authored common pivot at their own footfalls; pelvis yaw and three-count vertical excursion read the same clock.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation course supplies both foot placements and root yaw.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The pivot and turn are authored, and the lowering scales with stature.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The retained yaw curve supplies both endpoint placement and displayed yaw.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The callbacks retain only numeric phase values and the pivot.
 */
export function prepareWaltzBox(
  options: NonNullable<IAutoMovieMotionHumanDance.IParams["waltz"]>,
  origin: IAutoMovieVector3,
  metre: number,
  beatPeriod: number,
  firstBeat: number,
  lastBeat: number,
  duration: number,
): {
  yaw: (seconds: number) => number;
  depth: (seconds: number) => number;
  rotate: (placement: IAutoMovieMotionHumanFoot.IPlacement, seconds: number) => IAutoMovieMotionHumanFoot.IPlacement;
} {
  const pivot: IAutoMovieVector3 = options.pivot ?? origin;
  const turn: number = options.turn ?? 0;
  const yaw = (seconds: number): number => turn * minimumJerk.share(seconds / Math.max(beatPeriod, lastBeat));
  return {
    yaw,
    depth: (seconds: number): number => {
      const beat: number = 1 + (seconds - firstBeat) / beatPeriod;
      const lowered: number = (1 - Math.cos((2 * Math.PI * beat) / 3)) / 2;
      const gate: number = minimumJerk.share(seconds / beatPeriod) * minimumJerk.share((duration - seconds) / beatPeriod);
      return 0.012 * metre * lowered * gate;
    },
    rotate: (placement: IAutoMovieMotionHumanFoot.IPlacement, seconds: number): IAutoMovieMotionHumanFoot.IPlacement => {
      const angle: number = yaw(seconds);
      return angle === 0 ? placement : {
        ankle: HumanFrame.point({ origin: pivot, yaw: angle }, Vector3.subtract(placement.ankle, pivot)),
        rotation: Quaternion.multiply(Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, angle), placement.rotation),
      };
    },
  };
}
