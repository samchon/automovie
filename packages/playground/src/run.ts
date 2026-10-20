import type {
  IAutoMovieJointPose,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";

import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";
import { createStickmanMotionRoot as root } from "./createStickmanMotionRoot";

/**
 * Authored 0.6-second in-place run loop with five keys alternating contact and flight poses. Metre root heights are -0.03/+0.14; named flight/contact states are choreographic labels, not verified airborne phases, force integration or physiological gait. The receiving page supplies joint axes/rest frames and optional constraint clamping.
 *
 * @evidence contracts/common.md#principled-implementation Contact/flight factories preserve the leaning spine and bent-elbow arm recipe, with equal first/last contact values and fixed easeInOut timings.
 * @evidence contracts/common.md#clear-and-simple-design Bounded stance/flight vocabulary produces one sparse clip while travel baking, playback and collision remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored limb angles and vertical roots are neither measured running capability nor proof of foot contact; no solver or physics fallback fabricates those claims.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies span, frame population, root heights and the limits of contact/flight terminology.
 * @evidence contracts/performance.md#efficient-algorithms Five bounded poses/keys and two phase factories give constant construction; actual model sampling/FK and rendering retain their downstream costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Lean joint records are shared among local frames and phase formulas are reused; output clips are not cached across callers and travel baking reuses its supplied base.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned frames borrow their call's lean vocabulary, which must not be mutated independently through one frame; no runtime task or graphics handle is retained here.
 */
export const run: (sk: string) => IAutoMovieMotion = (
  sk: string,
): IAutoMovieMotion => {
  const lean: IAutoMovieJointPose[] = [
    j("spine", { flexion: 14 }),
    j("chest", { flexion: 8 }),
  ];
  // a runner pumps with the elbows held bent ~90° (forearms up), swinging
  // fore/aft from the shoulder, not straight arms windmilling
  const arms: (s: number) => IAutoMovieJointPose[] = (
    s: number,
  ): IAutoMovieJointPose[] => [
    j("leftUpperArm", { abduction: 48, flexion: -48 * s }),
    j("leftLowerArm", { flexion: 88 }),
    j("rightUpperArm", { abduction: 48, flexion: 48 * s }),
    j("rightLowerArm", { flexion: 88 }),
  ];
  const contact: (lead: "left" | "right") => IAutoMoviePose = (
    lead: "left" | "right",
  ): IAutoMoviePose => {
    const s: number = lead === "left" ? 1 : -1;
    return pose(
      sk,
      [
        ...lean,
        j("leftUpperLeg", { flexion: 45 * s }),
        j("rightUpperLeg", { flexion: -45 * s }),
        j("leftLowerLeg", { flexion: lead === "left" ? 20 : 58 }),
        j("rightLowerLeg", { flexion: lead === "left" ? 58 : 20 }),
        ...arms(s),
      ],
      root(0, -0.03, 0, 0),
    );
  };
  const flight: (swing: "left" | "right") => IAutoMoviePose = (
    swing: "left" | "right",
  ): IAutoMoviePose =>
    pose(
      sk,
      [
        ...lean,
        j("leftUpperLeg", { flexion: swing === "left" ? 35 : -10 }),
        j("rightUpperLeg", { flexion: swing === "right" ? 35 : -10 }),
        j("leftLowerLeg", { flexion: swing === "left" ? 85 : 25 }),
        j("rightLowerLeg", { flexion: swing === "right" ? 85 : 25 }),
        ...arms(0),
      ],
      root(0, 0.14, 0, 0),
    );
  return {
    id: "run",
    skeleton: sk,
    duration: 0.6,
    loop: true,
    keyframes: [
      key(0, contact("left")),
      key(0.15, flight("right")),
      key(0.3, contact("right")),
      key(0.45, flight("left")),
      key(0.6, contact("left")),
    ],
  };
};
