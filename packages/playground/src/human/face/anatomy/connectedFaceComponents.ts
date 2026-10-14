import type { IAutoMovieHumanFaceComponentTree } from "@automovie/human";

import { connectedFaceAppearance } from "./connectedFaceAppearance";
import { connectedFaceEars } from "./connectedFaceEars";
import { connectedFaceEyes } from "./connectedFaceEyes";
import { connectedFaceFrame } from "./connectedFaceFrame";
import { connectedFaceMouth } from "./connectedFaceMouth";
import { connectedFaceNose } from "./connectedFaceNose";

/**
 * The selected connected-head revision's complete semantic component tree.
 * Each child module owns one anatomical or appearance scope and its exact
 * channel IDs. The root owns the continuous `Human` skin topology; its nose,
 * lids, lips, ears and cheeks are distinct editable forms on that same mesh.
 * A new basis revision must supply a new or reverified tree rather than borrow
 * this application's labels. No grouping changes the flat stored document or
 * the numerical builder's original channel order.
 * The root owns the document's anatomical record, whose measurements and
 * observations span every child scope.
 *
 */
export const connectedFaceComponents: IAutoMovieHumanFaceComponentTree = {
  basis: "connected-head-2026-10-02-cranial-breadth",
  root: {
    id: "face",
    label: "Face",
    description:
      "Whole connected face; skin is shared by nested anatomical forms.",
    channels: [],
    surfaces: ["Human"],
    documentFields: ["anatomical"],
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
