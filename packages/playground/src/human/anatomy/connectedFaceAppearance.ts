import type { IAutoMovieHumanFaceComponentTree } from "@automovie/human";

/**
 * Appearance inputs without basis shape endpoints. Skin pigmentation, material
 * overrides and numerical scalp populations are authored independently of the
 * connected anatomical skin; hair cards are generated after posing and contact
 * by `createHumanFaceHairBuilder`, not stored as personal guide coordinates.
 * SideFX documents grouping curves into cards and density-derived coverage at
 * https://www.sidefx.com/docs/houdini/nodes/sop/haircardgen.html . This is a
 * representation precedent, not evidence that the current groom is biologic.
 *
 */
export const connectedFaceAppearance: IAutoMovieHumanFaceComponentTree.Node = {
  id: "appearance",
  label: "Surface appearance",
  description:
    "Pigment and fibre fields; these do not own separate skin meshes.",
  channels: [],
  surfaces: [],
  documentFields: ["materials"],
  children: [
    {
      id: "skin-appearance",
      label: "Skin pigmentation",
      description: "Neutral-coordinate colour fields on the connected skin.",
      channels: [],
      surfaces: [],
      documentFields: ["skin"],
      children: [],
    },
    {
      id: "scalp-hair",
      label: "Scalp hair",
      description: "Numerical root populations and generated hair-card output.",
      channels: [],
      surfaces: [],
      documentFields: ["hair"],
      children: [],
    },
  ],
};
