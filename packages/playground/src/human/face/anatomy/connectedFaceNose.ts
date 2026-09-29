import type { IAutoMovieHumanFaceComponentTree } from "@automovie/human";

/**
 * Nasal source controls over the one connected skin surface. The MPFB CC0
 * target provenance is pinned at
 * https://github.com/makehumancommunity/mpfb2/tree/817587ceb2ea03ea17a5b47e04396cbb4ddfa2d5 .
 * Root, dorsum, tip and ala are useful authoring scopes, not independent
 * cartilage meshes or population-derived biological ranges. The shape axes
 * keep their authored source geometry until a measured anatomical study can
 * support a more specific model; a channel's label is not such evidence.
 *
 */
export const connectedFaceNose: IAutoMovieHumanFaceComponentTree.Node = {
  id: "nose",
  label: "Nose",
  description: "Nasal source endpoints deform the same continuous facial skin.",
  channels: [
    "noseWidth",
    "noseHeight",
    "noseDepth",
    "nasalVolume",
    "nasalCompression",
    "noseForwardPosition",
    "noseElevation",
    "noseLateralPosition",
  ],
  surfaces: [],
  documentFields: [],
  children: [
    {
      id: "nasal-bridge",
      label: "Root and bridge",
      description: "Upper width, dorsum curvature and nasal root projection.",
      channels: [
        "noseUpperWidth",
        "noseMiddleWidth",
        "noseBridgeHump",
        "nasalDorsumCurvature",
        "nasalRootProjection",
      ],
      surfaces: [],
      documentFields: [],
      children: [],
    },
    {
      id: "nasal-tip",
      label: "Tip and septum",
      description: "Tip proportions and inferior nasal attachment.",
      channels: [
        "noseTipWidth",
        "noseTipElevation",
        "noseBaseElevation",
        "noseSeptumAngle",
      ],
      surfaces: [],
      documentFields: [],
      children: [],
    },
    {
      id: "nasal-alae",
      label: "Alae and nostrils",
      description: "Lower width, nostril shape and sneer performance.",
      channels: [
        "noseLowerWidth",
        "nostrilWidth",
        "noseFlaring",
        "nostrilAngle",
        "noseSneerLeft",
        "noseSneerRight",
      ],
      surfaces: [],
      documentFields: [],
      children: [],
    },
  ],
};
