import type {
  IAutoMovieHumanHandPose,
  IAutoMovieHumanPose,
} from "@automovie/human";

/**
 * Starting authored guard for geometry inspection, before supported motion fitting.
 *
 * @evidence contracts/common.md#implementation-and-ownership Explicit clinical degrees articulate shoulders, trunk, knees, ankles and closed fingers. This seed is not claimed to be physically admitted or an accepted film frame.
 * @evidence contracts/common.md#authoring-interface Returns an independent public pose in anatomical own-side coordinates, with no world placement or motion timeline.
 */
export function inspectionGuard(): IAutoMovieHumanPose {
  const hand: IAutoMovieHumanHandPose = {
    thumb: {
      cmcFlexion: 10,
      cmcAbduction: 20,
      cmcOpposition: 30,
      mcpFlexion: 30,
      ipFlexion: 35,
    },
    index: { mcpFlexion: 65, pipFlexion: 80, dipFlexion: 50 },
    middle: { mcpFlexion: 70, pipFlexion: 80, dipFlexion: 50 },
    ring: { mcpFlexion: 70, pipFlexion: 80, dipFlexion: 50 },
    little: { mcpFlexion: 70, pipFlexion: 80, dipFlexion: 50 },
  };
  return {
    pelvis: { rotation: -20 },
    spine: { thoracic: { flexion: 6, rotation: 15 }, lumbar: { flexion: 3 } },
    arms: {
      left: {
        shoulder: { flexion: 55, abduction: 12, rotation: -20 },
        elbow: { flexion: 130 },
        forearm: { pronation: 25 },
        hand: structuredClone(hand),
      },
      right: {
        shoulder: { flexion: 50, abduction: 10, rotation: -15 },
        elbow: { flexion: 130 },
        forearm: { pronation: 15 },
        hand: structuredClone(hand),
      },
    },
    legs: {
      left: {
        hip: { flexion: 25, abduction: 10, rotation: 5 },
        knee: { flexion: 35 },
        ankle: { dorsiflexion: 10 },
      },
      right: {
        hip: { flexion: 3, abduction: 10, rotation: 5 },
        knee: { flexion: 30 },
        ankle: { dorsiflexion: 10 },
      },
    },
  };
}
