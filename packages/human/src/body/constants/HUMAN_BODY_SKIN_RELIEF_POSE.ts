import type { IAutoMovieHumanBodySkinReliefPose } from "../structures/IAutoMovieHumanBodySkinReliefPose";

/**
 * How the skin's anatomical relief follows a pose.
 *
 * - **Joints.** The ones whose creases and wrinkles the relief carries: the
 *   finger joints (metacarpophalangeal, proximal and distal
 *   interphalangeal) and the thumb's metacarpophalangeal and
 *   interphalangeal joints, the wrist, the elbow and the knee, each with the
 *   width along its bone over which its creases lie (the relief's own
 *   placement: a finger's within a few millimetres of the joint, the knee's
 *   suprapatellar wrinkles 2 to 4 cm above it) and the distance from the
 *   bone's axis within which skin is its own limb's.
 * - **Folding and stretching.** Bending a joint folds the skin on the side it
 *   bends toward and stretches the other side: a flexion crease deepens and
 *   the wrinkles over the extension side flatten, until at the end of the
 *   range the stretched skin is smooth. Straightening past rest does the
 *   reverse. Both change linearly with the share of the range the joint has
 *   travelled from rest; the deepening to half again at the end is authored.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Holds the joints and factors by which the skin's creases follow a pose.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Fixes the relief-pose joints, their widths and reaches, and the deepening and flattening factors.
 */
export const HUMAN_BODY_SKIN_RELIEF_POSE: IAutoMovieHumanBodySkinReliefPose = {
  joints: [
    ...["Index", "Middle", "Ring", "Little"].flatMap((finger) =>
      ["Proximal", "Intermediate", "Distal"].map((segment) => ({
        bone: finger + segment,
        sigmaMetres: 0.005,
        reachMetres: 0.012,
      })),
    ),
    { bone: "ThumbProximal", sigmaMetres: 0.006, reachMetres: 0.014 },
    { bone: "ThumbDistal", sigmaMetres: 0.005, reachMetres: 0.013 },
    { bone: "Hand", sigmaMetres: 0.015, reachMetres: 0.04 },
    { bone: "LowerArm", sigmaMetres: 0.035, reachMetres: 0.06 },
    { bone: "LowerLeg", sigmaMetres: 0.045, reachMetres: 0.08 },
  ],
  deepen: 0.5,
  flatten: 1,
};
