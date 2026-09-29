import type { IAutoMovieHumanFaceComponentTree } from "@automovie/human";

import { connectedFaceAppearance } from "./connectedFaceAppearance";
import { connectedFaceEars } from "./connectedFaceEars";
import { connectedFaceEyes } from "./connectedFaceEyes";
import { connectedFaceFrame } from "./connectedFaceFrame";
import { connectedFaceMouth } from "./connectedFaceMouth";
import { connectedFaceNose } from "./connectedFaceNose";

/**
 * The selected CC0 connected-head revision's complete semantic component tree.
 * Each child module owns one anatomical or appearance scope and its exact
 * channel IDs. The root owns the continuous `Human` skin topology; its nose,
 * lids, lips, ears and cheeks are distinct editable forms on that same mesh.
 * The corresponding basis and its source hashes are committed under the
 * selected global-face study; source assets are CC0 source and extra targets,
 * pinned at the upstream source
 * and the upstream source .
 * A new basis revision must supply a new or reverified tree rather than borrow
 * this application's labels. No grouping changes the flat stored document or
 * the numerical builder's original channel order.
 *
 */
export const connectedFaceComponents: IAutoMovieHumanFaceComponentTree = {
  basis: "connected-head-2026-09-28-crown-scallop",
  root: {
    id: "face",
    label: "Face",
    description:
      "Whole connected face; skin is shared by nested anatomical forms.",
    channels: [],
    surfaces: ["Human"],
    documentFields: [],
    children: [
      connectedFaceFrame,
      connectedFaceEyes,
      connectedFaceNose,
      connectedFaceMouth,
      connectedFaceEars,
      connectedFaceAppearance,
    ],
  },
};
