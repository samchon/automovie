import type {
  AutoMovieHumanoidBone,
  IAutoMovieActionCall,
  IAutoMovieMotion,
} from "@automovie/interface";

import type { IAutoMovieJointAxes, IAutoMovieActionSynthesizer, IAutoMovieRestFrame } from "@automovie/engine";


import { validSynthesizer } from "./filmFixtures";
import { joint, keyframe, makeMotion, makePose } from "./fixtures";

/**
 * Build the mount case's custom hip basis and its two-second clinical walk.
 * Fresh records move the horse two metres along X at fixed 30-degree hip flexion.
 *
 * @evidence contracts/testing.md#behavioral-verification The mount entry uses this fixture to compare baked follow with shared attachment FK and distinguish custom clinical mappings from humanoid fallback.
 * @evidence contracts/testing.md#independent-expectations Authored hip flexion 30, neutral 15 and the custom axes remain literal inputs; the owning entry documents that its shared FK reference checks handoff consistency rather than independent kinematics.
 * @evidence contracts/testing.md#distinguishing-cases Supplies the existing custom-basis moving horse while other actors use validSynthesizer; the mount entry retains all assertions and owns the fallback contrast.
 * @evidence contracts/testing.md#execution-ownership This portable synchronous helper creates in-memory records for the discoverable mount entry, with no host, asset, shared cache or dynamically registered case.
 */
export function createFilmClinicalMountFixture(): {
  jointAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  restFrames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
  synthesize: IAutoMovieActionSynthesizer;
} {
  const jointAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    {
      hips: {
        flexion: { x: 0, y: 0, z: 1 },
        abduction: { x: 1, y: 0, z: 0 },
        twist: { x: 0, y: 1, z: 0 },
      },
    };
  const restFrames: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  > = {
    hips: { flexion: { sign: 1 as const, neutral: 15 } },
  };
  const motion: IAutoMovieMotion = makeMotion(
    [
      keyframe(
        0,
        makePose([joint("hips", { flexion: 30 })], {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        }),
      ),
      keyframe(
        2,
        makePose([joint("hips", { flexion: 30 })], {
          translation: { x: 2, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        }),
      ),
    ],
    2,
  );
  const synthesize: IAutoMovieActionSynthesizer = (
    action: IAutoMovieActionCall,
    actor: string,
  ): IAutoMovieMotion | null =>
    actor === "horse" ? motion : validSynthesizer(action, actor);
  return { jointAxes, restFrames, synthesize };
}
