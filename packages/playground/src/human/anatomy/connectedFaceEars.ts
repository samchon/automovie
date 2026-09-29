import type { IAutoMovieHumanFaceComponentTree } from "@automovie/human";

/**
 * Paired pinna controls of the selected MPFB basis, whose CC0 source targets
 * are pinned at https://github.com/makehumancommunity/mpfb2/tree/817587ceb2ea03ea17a5b47e04396cbb4ddfa2d5 .
 * The left and right auricles are independently edited source displacements
 * on `Human`, not separate output meshes or clinical measurements of normal
 * pinna proportions. An angular outline endpoint is explicitly stylized.
 *
 */
export const connectedFaceEars: IAutoMovieHumanFaceComponentTree.Node = {
  id: "ears",
  label: "Ears",
  description: "Paired auricular source forms on the connected head skin.",
  channels: [],
  surfaces: [],
  documentFields: [],
  children: [
    {
      id: "left-ear",
      label: "Left ear",
      description: "Subject-left pinna size, position, lobe and outline.",
      channels: [
        "leftEarScale",
        "leftEarHeight",
        "leftEarDepth",
        "leftEarLobe",
        "leftEarWing",
        "leftEarFlap",
        "leftEarRotation",
        "leftEarRoundness",
        "leftEarForwardPosition",
        "leftEarElevation",
        "leftEarAngularOutline",
      ],
      surfaces: [],
      documentFields: [],
      children: [],
    },
    {
      id: "right-ear",
      label: "Right ear",
      description: "Subject-right pinna size, position, lobe and outline.",
      channels: [
        "rightEarScale",
        "rightEarHeight",
        "rightEarDepth",
        "rightEarLobe",
        "rightEarWing",
        "rightEarFlap",
        "rightEarRotation",
        "rightEarRoundness",
        "rightEarForwardPosition",
        "rightEarElevation",
        "rightEarAngularOutline",
      ],
      surfaces: [],
      documentFields: [],
      children: [],
    },
  ],
};
