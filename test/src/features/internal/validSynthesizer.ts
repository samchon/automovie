import type { IAutoMovieActionSynthesizer } from "../../../../packages/engine/src/perform/IAutoMovieActionSynthesizer";
import { FIXTURE_BONE } from "./FIXTURE_BONE";
import { fixtureRegionDrivesBone } from "./fixtureRegionDrivesBone";
import { joint, keyframe, makeMotion, makePose } from "./fixtures";

/**
 * The existing film assembly fixture synthesizer emits one-second 0-to-120-degree elbow keys when the action owns that region and otherwise joint-empty keys. It retains the three-argument synthesizer contract while using only action, assumes the canonical fixture rig and delegates retiming/masking/admission to the real pipeline.
 */
export const validSynthesizer: IAutoMovieActionSynthesizer = (
  action: Parameters<IAutoMovieActionSynthesizer>[0],
): ReturnType<IAutoMovieActionSynthesizer> => {
  return makeMotion(
    fixtureRegionDrivesBone(action)
      ? [
          keyframe(0, makePose([joint(FIXTURE_BONE, { flexion: 0 })])),
          keyframe(1, makePose([joint(FIXTURE_BONE, { flexion: 120 })])),
        ]
      : [keyframe(0, makePose([])), keyframe(1, makePose([]))],
    1,
  );
};
