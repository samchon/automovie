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
 * selected global-face study; source assets are CC0 MPFB2 and extra targets,
 * pinned at https://github.com/makehumancommunity/mpfb2/tree/817587ceb2ea03ea17a5b47e04396cbb4ddfa2d5
 * and https://github.com/makehumancommunity/mpfb-extra-targets/tree/7eaba3453134385bb5ea9811ef0b33b85b4b556d .
 * A new basis revision must supply a new or reverified tree rather than borrow
 * this application's labels. No grouping changes the flat stored document or
 * the numerical builder's original channel order.
 * The root owns the document's anatomical record, whose measurements and
 * observations span every child scope.
 *
 */
export const connectedFaceComponents: IAutoMovieHumanFaceComponentTree = {
  basis: "mpfb-connected-head-2026-10-02-cranial-breadth",
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
