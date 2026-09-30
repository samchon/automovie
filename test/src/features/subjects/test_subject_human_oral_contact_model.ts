import { measureAutoMovieMeshClearance } from "@automovie/engine";
import { buildHumanFace } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { coarseHumanFaceFixture } from "../internal/humanFaceFixture";

/**
 * The real face builder keeps its enamel behind the lips it built.
 *
 * Scenarios:
 * 1. An open coarse face whose upper arch is placed at the lip plane (no
 *    recess) and whose lower arch hangs from the jaw has both arches at least
 *    touching the lips along Z after the build, so the builder resolved the
 *    contact its components alone would leave.
 */
export const test_subject_human_oral_contact_model = (): void => {
  const face = coarseHumanFaceFixture("oral-contact-consumer");
  face.basis.bindings.jawHinge = { x: 0, y: 0, z: -45 };
  face.basis.bindings.dentition = {
    rightCorner: 78,
    leftCorner: 308,
    upperLipMiddle: 13,
  };
  const crown = { width: 5, height: 7, depth: 1.5, cervicalWidth: 0.8, edgeRise: 0.3 };
  const row = { halfWidth: 22, depth: 15, gap: 0.1, crowns: [crown] };
  face.basis.recipe.dentition = { row, placement: { lift: 0, recess: 0 } };
  face.basis.recipe.lowerDentition = { row, placement: { drop: 5, recess: 0 } };
  face.expression = { lipPart: 10 };
  const model = buildHumanFace(face, 0);
  const mesh = (id: string) => {
    const part = model.parts.find((one) => one.id === id);
    if (part?.geometry.type !== "mesh") throw new Error("Missing " + id);
    return part.geometry.mesh;
  };
  for (const id of ["tooth-upper-arch", "tooth-lower-arch"])
    TestValidator.predicate(
      "enamel is not in front of the lips: " + id,
      measureAutoMovieMeshClearance(mesh("lips"), mesh(id), "z").every(
        ({ minimum }) => minimum >= -1e-9,
      ),
    );
};
