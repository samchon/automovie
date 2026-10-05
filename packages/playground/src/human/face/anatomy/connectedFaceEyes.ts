import type { IAutoMovieHumanFaceComponentTree } from "@automovie/human";

/**
 * Selected basis's periocular hierarchy. The paired globes, brow cards and
 * lashes are three resident meshes; lids and canthi remain on the shared skin.
 * Source endpoints are CC0 MPFB extra targets at
 * https://github.com/makehumancommunity/mpfb-extra-targets/tree/7eaba3453134385bb5ea9811ef0b33b85b4b556d .
 * MRI observations in https://pmc.ncbi.nlm.nih.gov/articles/PMC7392398/
 * show that ocular rotation can be eccentric and translated. This source's
 * gaze endpoint fit is an authored approximation, not a universal fixed COR.
 * Paired controls keep their original left/right identities even though one
 * eye mesh holds both globes and the continuous skin holds both eyelids.
 *
 */
export const connectedFaceEyes: IAutoMovieHumanFaceComponentTree.Node = {
  id: "orbits",
  label: "Eyes and orbits",
  description:
    "Paired optical organs with shared skin lids and separate fibre meshes. Independent optical dimensions need the basis's optical support and are otherwise refused by name.",
  channels: [],
  surfaces: ["Human.low-poly"],
  documentFields: ["iris", "eyes"],
  children: [
    {
      id: "brows",
      label: "Brows",
      description: "Shared brow fibre mesh and periocular skin controls.",
      channels: [
        "browElevation",
        "browProjection",
        "browAngle",
        "browDownLeft",
        "browDownRight",
        "browInnerUp",
        "browOuterUpLeft",
        "browOuterUpRight",
      ],
      surfaces: ["Human.eyebrow001"],
      documentFields: [],
      children: [],
    },
    {
      id: "left-orbit",
      label: "Left eye and lids",
      description: "Subject-left globe fitting, aperture, folds and gaze.",
      channels: [
        "leftEyeScale",
        "leftEyeHeight",
        "leftEyeElevation",
        "leftEyeLateralPosition",
        "leftEyeFoldHeight",
        "leftEyeBagVolume",
        "leftEyeBagHeight",
        "leftLateralCanthusElevation",
        "leftMedialEyeApertureHeight",
        "leftLateralCanthusExpansion",
        "leftLateralEyeApertureHeight",
        "leftMedialCanthusExpansion",
        "leftEpicanthalFold",
        "leftEyelidFoldAngle",
        "leftUnderEyeLateralPosition",
        "leftMedialCanthusElevation",
        "leftEyelidFoldConvexity",
        "leftEyeDepth",
        "eyeBlinkLeft",
        "eyeLookDownLeft",
        "eyeLookInLeft",
        "eyeLookOutLeft",
        "eyeLookUpLeft",
        "eyeSquintLeft",
        "eyeWideLeft",
      ],
      surfaces: [],
      documentFields: [],
      children: [],
    },
    {
      id: "right-orbit",
      label: "Right eye and lids",
      description: "Subject-right globe fitting, aperture, folds and gaze.",
      channels: [
        "rightEyeScale",
        "rightEyeHeight",
        "rightEyeElevation",
        "rightEyeLateralPosition",
        "rightEyeFoldHeight",
        "rightEyeBagVolume",
        "rightEyeBagHeight",
        "rightLateralCanthusElevation",
        "rightMedialEyeApertureHeight",
        "rightLateralCanthusExpansion",
        "rightLateralEyeApertureHeight",
        "rightMedialCanthusExpansion",
        "rightEpicanthalFold",
        "rightEyelidFoldAngle",
        "rightUnderEyeLateralPosition",
        "rightMedialCanthusElevation",
        "rightEyelidFoldConvexity",
        "rightEyeDepth",
        "eyeBlinkRight",
        "eyeLookDownRight",
        "eyeLookInRight",
        "eyeLookOutRight",
        "eyeLookUpRight",
        "eyeSquintRight",
        "eyeWideRight",
      ],
      surfaces: [],
      documentFields: [],
      children: [],
    },
    {
      id: "lashes",
      label: "Eyelashes",
      description: "One fibre mesh attached to both eyelid margins. Independent upper and lower lash profiles need the basis's periocular registration and are otherwise refused by name.",
      channels: [],
      surfaces: ["Human.eyelashes01"],
      documentFields: ["lashes"],
      children: [],
    },
  ],
};
