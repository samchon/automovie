import type { IAutoMovieHumanFaceComponentTree } from "@automovie/human";

/**
 * Oral hierarchy over shared vermilion skin, rigid dentition and tongue mesh.
 * The expression endpoint provenance is MPFB extra targets at
 * https://github.com/makehumancommunity/mpfb-extra-targets/tree/7eaba3453134385bb5ea9811ef0b33b85b4b556d .
 * Kozlov et al. 2017, https://la.disneyresearch.com/wp-content/uploads/Enriching-Facial-Blendshape-Rigs-with-Physical-Simulation-Paper2.pdf ,
 * show why blendshape lips need tissue and dental contact. Their volumetric
 * simulation is not the deterministic surface-floor rule of this editor.
 * Oral channels and lower-jaw channels meet at the connected builder's contact
 * stage; this navigation hierarchy does not claim they can evaluate apart.
 *
 */
export const connectedFaceMouth: IAutoMovieHumanFaceComponentTree.Node = {
  id: "mouth",
  label: "Mouth and oral cavity",
  description:
    "Shared lip skin meets separate rigid teeth and articulated tongue.",
  channels: [
    "mouthWidth",
    "mouthHeight",
    "mouthDepth",
    "mouthElevation",
    "mouthForwardPosition",
    "mouthLateralPosition",
    "mouthClose",
    "mouthFunnel",
    "mouthPucker",
    "mouthPressLeft",
    "mouthPressRight",
    "mouthLeft",
    "mouthRight",
  ],
  surfaces: [],
  documentFields: [],
  children: [
    {
      id: "upper-lip",
      label: "Upper lip and philtrum",
      description:
        "Upper vermilion shape and observed-relative lip performance.",
      channels: [
        "upperLipHeight",
        "upperLipVolume",
        "upperLipWidth",
        "upperLipLateralElevation",
        "upperLipCentralElevation",
        "upperVermilionHeight",
        "cupidsBowDefinition",
        "cupidsBowWidth",
        "philtrumVolume",
        "mouthUpperUpLeft",
        "mouthUpperUpRight",
        "mouthRollUpper",
        "mouthShrugUpper",
      ],
      surfaces: [],
      documentFields: [],
      children: [],
    },
    {
      id: "lower-lip",
      label: "Lower lip",
      description: "Lower vermilion shape and mandibular-side lip performance.",
      channels: [
        "lowerLipHeight",
        "lowerLipVolume",
        "lowerLipWidth",
        "lowerLipLateralElevation",
        "lowerLipCentralElevation",
        "lowerVermilionHeight",
        "mouthLowerDownLeft",
        "mouthLowerDownRight",
        "mouthRollLower",
        "mouthShrugLower",
      ],
      surfaces: [],
      documentFields: [],
      children: [],
    },
    {
      id: "commissures",
      label: "Mouth corners",
      description:
        "Paired smile, frown, stretch, dimple and retraction fields.",
      channels: [
        "mouthCornerRestElevation",
        "mouthDimpleShape",
        "mouthDimpleLeft",
        "mouthDimpleRight",
        "mouthFrownLeft",
        "mouthFrownRight",
        "mouthSmileLeft",
        "mouthSmileRight",
        "mouthStretchLeft",
        "mouthStretchRight",
        "mouthSmileRetractLeft",
        "mouthSmileRetractRight",
      ],
      surfaces: [],
      documentFields: [],
      children: [],
    },
    {
      id: "dentition",
      label: "Dentition",
      description: "One rigid dental mesh with upper and mandibular arches.",
      channels: [],
      surfaces: ["Human.teeth_base"],
      documentFields: [],
      children: [],
    },
    {
      id: "tongue",
      label: "Tongue",
      description: "Separate tongue surface and protrusion performance.",
      channels: ["tongueOut"],
      surfaces: ["Human.tongue01"],
      documentFields: [],
      children: [],
    },
  ],
};
