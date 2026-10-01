import type { IAutoMovieHumanFaceComponentTree } from "@automovie/human";

/**
 * Selected MPFB connected basis: whole-head, cheek, mandibular and neck axes.
 * These are authored displacement endpoints from the CC0 MPFB assets, pinned
 * at https://github.com/makehumancommunity/mpfb2/tree/817587ceb2ea03ea17a5b47e04396cbb4ddfa2d5 .
 * The global age, ancestry and dimorphism axes are source-morph coordinates,
 * not a person's measured age, ancestry, sex or a biological prediction.
 * The jaw node also owns performance channels that drive the coupled rigid
 * articulation; observed condylar rotation plus translation is documented at
 * https://pubmed.ncbi.nlm.nih.gov/7771361/ , while this asset's linear path is
 * an authored endpoint interpolation, not that study's measured trajectory.
 * This app-owned map changes navigation only. The `Human` skin surface stays
 * connected under the root and may be affected by every child here.
 *
 */
export const connectedFaceFrame: IAutoMovieHumanFaceComponentTree.Node = {
  id: "craniofacial",
  label: "Craniofacial frame",
  description:
    "Shared head and neck form; the skin remains one connected mesh.",
  channels: [],
  surfaces: [],
  documentFields: [],
  children: [
    {
      id: "global-form",
      label: "Global form",
      description: "Source morphology axes, not demographic measurements.",
      channels: [
        "faceAgeStructure",
        "globalAgeStructure",
        "globalSexualDimorphism",
        "globalAdiposity",
        "globalMuscularity",
        "africanAncestry",
        "asianAncestry",
        "europeanAncestry",
      ],
      surfaces: [],
      documentFields: [],
      children: [],
    },
    {
      id: "cranium",
      label: "Cranium and forehead",
      description: "Head outline and frontal envelope on shared skin.",
      channels: [
        "headWidth",
        "headHeight",
        "headDepth",
        "posteriorHeadDepth",
        "foreheadHeight",
        "foreheadProjection",
        "templeWidth",
        "cranialBreadth",
        "headOutlineInvertedtriangular",
        "headOutlineDiamond",
        "headOutlineOval",
        "headOutlineRectangular",
        "headOutlineRound",
        "headOutlineTriangular",
        "headOutlineSquare",
        "faceBreadth",
      ],
      surfaces: [],
      documentFields: [],
      children: [],
    },
    {
      id: "cheeks",
      label: "Cheeks and midface",
      description: "Malar, buccal and nasolabial source fields on shared skin.",
      channels: [
        "cheekFullness",
        "leftCheekVolume",
        "leftCheekBone",
        "leftCheekInner",
        "leftCheekElevation",
        "rightCheekVolume",
        "rightCheekBone",
        "rightCheekInner",
        "rightCheekElevation",
        "nasolabialFoldShape",
        "cheekPuff",
        "cheekSquintLeft",
        "cheekSquintRight",
      ],
      surfaces: [],
      documentFields: [],
      children: [],
    },
    {
      id: "mandible",
      label: "Mandible and chin",
      description: "Chin shape and jaw motion, coupled to oral contact.",
      channels: [
        "chinWidth",
        "chinHeight",
        "chinProjection",
        "chinBoneWidth",
        "chinCleft",
        "chinTriangularity",
        "mentalHeight",
        "jawPrognathism",
        "jawRestHeight",
        "jawTaper",
        "jawForward",
        "jawLeft",
        "jawOpen",
        "jawRight",
      ],
      surfaces: [],
      documentFields: [],
      children: [],
    },
    {
      id: "neck",
      label: "Neck",
      description: "Cervical contour of the clipped shared skin surface.",
      channels: ["neckWidth", "neckDepth", "neckUnderChinFullness"],
      surfaces: [],
      documentFields: [],
      children: [],
    },
  ],
};
