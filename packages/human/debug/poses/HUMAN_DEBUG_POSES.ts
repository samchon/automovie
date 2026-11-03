import type { IAutoMovieHumanPose } from "../../src/structures/pose/IAutoMovieHumanPose";

/**
 * Named poses in the public pose type, shared by the viewer and the pose tests.
 *
 * - `neutral`: `{}`, the anatomical neutral every field is measured from. The
 *   generated A-pose is the skin's bind and has no pose here.
 * - `demo`: a step and reach exercising every region: gaze and an open jaw,
 *   head turn and nod, thoracic rotation and lumbar flexion, a reaching left
 *   arm with a spread hand, a right fist with a pronated forearm, a raised
 *   left leg with lifted toes and a supinated forefoot, and curled right toes.
 * - `limit`: requests beyond the range of motion (knee and elbow 175, hip 150,
 *   finger PIP 130, toe extension 100, neck flexion 60 and nod 40 degrees);
 *   typia tags do not stop such a value at compile time, so a consumer clamps
 *   it to the range.
 * - `raised`: both arms abducted to overhead, 179 degrees, the shoulder's
 *   range end that opens the axillae furthest.
 * - `flexed`: both elbows, hips and knees at their ranges' ends together, the
 *   deepest bend of the groin, the elbows and the knees.
 */
export const HUMAN_DEBUG_POSES: Record<string, IAutoMovieHumanPose> = {
  neutral: {},
  demo: {
    head: {
      eyes: { left: { horizontal: 20 }, right: { horizontal: 20 } },
      jaw: { opening: 25 },
    },
    neck: {
      atlantoOccipital: { flexion: 5 },
      atlantoAxial: { rotation: 25 },
    },
    arms: {
      left: {
        shoulderGirdle: { elevation: 10, upwardRotation: 20, protraction: 10 },
        shoulder: { flexion: 95, abduction: 10 },
        elbow: { flexion: 25 },
        wrist: { flexion: -25 },
        hand: {
          thumb: { cmcAbduction: 45 },
          index: { mcpAbduction: 15 },
          middle: { mcpAbduction: 0 },
          ring: { mcpAbduction: 12 },
          little: { mcpAbduction: 18 },
        },
      },
      right: {
        shoulder: { flexion: 20, abduction: 25, rotation: 10 },
        elbow: { flexion: 110 },
        forearm: { pronation: 60 },
        hand: {
          thumb: { cmcFlexion: 10, mcpFlexion: 40, ipFlexion: 60 },
          index: { mcpFlexion: 80, pipFlexion: 90, dipFlexion: 60 },
          middle: { mcpFlexion: 80, pipFlexion: 90, dipFlexion: 60 },
          ring: { mcpFlexion: 80, pipFlexion: 90, dipFlexion: 60 },
          little: { mcpFlexion: 80, pipFlexion: 90, dipFlexion: 60 },
        },
      },
    },
    spine: {
      thoracic: { rotation: 20 },
      lumbar: { flexion: 10 },
    },
    legs: {
      left: {
        hip: { flexion: 60, abduction: 5 },
        knee: { flexion: 70, rotation: 15 },
        ankle: { dorsiflexion: 10 },
        foot: {
          midfootSupination: 20,
          hallux: { mtpFlexion: -50 },
          second: { mtpFlexion: -30 },
          third: { mtpFlexion: -30 },
          fourth: { mtpFlexion: -30 },
          fifth: { mtpFlexion: -30 },
        },
      },
      right: {
        knee: { flexion: 5 },
        foot: {
          hallux: { mtpFlexion: 30, ipFlexion: 45 },
          second: { mtpFlexion: 20, pipFlexion: 30, dipFlexion: 40 },
          third: { mtpFlexion: 20, pipFlexion: 30, dipFlexion: 40 },
          fourth: { mtpFlexion: 20, pipFlexion: 30, dipFlexion: 40 },
          fifth: { mtpFlexion: 20, pipFlexion: 30, dipFlexion: 40 },
        },
      },
    },
  },
  limit: {
    neck: {
      atlantoOccipital: { flexion: 40 },
      cervical: { flexion: 60 },
    },
    arms: {
      left: { elbow: { flexion: 175 } },
      right: {
        elbow: { flexion: 175 },
        hand: {
          index: { pipFlexion: 130 },
          middle: { pipFlexion: 130 },
        },
      },
    },
    legs: {
      left: {
        hip: { flexion: 150 },
        knee: { flexion: 175 },
        foot: { hallux: { mtpFlexion: -100 } },
      },
      right: {},
    },
  },
  raised: {
    arms: {
      left: { shoulder: { abduction: 179 } },
      right: { shoulder: { abduction: 179 } },
    },
  },
  flexed: {
    arms: {
      left: { elbow: { flexion: 147.3 } },
      right: { elbow: { flexion: 147.3 } },
    },
    legs: {
      left: { hip: { flexion: 132.1 }, knee: { flexion: 139.8 } },
      right: { hip: { flexion: 132.1 }, knee: { flexion: 139.8 } },
    },
  },
};
