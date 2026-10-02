import { conformHumanPersonCollar, createHumanPersonSeam } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanPersonTube } from "../internal/humanPersonTubeFixture";
import { nclose } from "../internal/predicates";

/**
 * Distinct boundary sources keep their own displacement when their projected
 * face parameters coincide; choosing another resident's delta would leave a gap.
 *
 * Scenarios:
 * 1. Two native boundary points on one face-corner ray have different heights
 *    and radii. Both project to that corner, and each reads its own Dirichlet
 *    displacement rather than the last tied lookup resident.
 * 2. Conforming those points reaches the same independently known face corner
 *    without changing either caller-owned native position array.
 */
export const test_human_person_cut_boundary_identity = (): void => {
  const face = humanPersonTube({ rings: [0, 0.02], segments: 8, radius: 0.05, close: "top" });
  const body = humanPersonTube({ rings: [-0.04, -0.02, -0.01], segments: 4, radius: 0.05, close: "bottom" });
  const a = body.rings[2][0];
  const b = body.rings[2][1];
  body.positions.splice(b * 3, 3, 0, -0.008, 0.055);
  const seam = createHumanPersonSeam({
    face: { basis: "analytic-face", surface: { id: "face", ...face } },
    body: { basis: "analytic-body", surface: { id: "body", ...body } },
    reachMetres: 0.03, headReachMetres: 0.02,
  });
  const indexes = [a, b].map((vertex) => seam.bodyLoop.indexOf(vertex));
  const parameters = indexes.map((index) => seam.collar.follow[index].edge + seam.collar.follow[index].fraction);
  TestValidator.predicate("arrangement has two distinct native sources at one face sample", a !== b && nclose(parameters[0], parameters[1]));
  TestValidator.predicate("each boundary source reads its own displacement", indexes.every((index) => {
    const seed = seam.collar.band.find((entry) => entry.vertex === seam.bodyLoop[index])!;
    return seed.low === index && seed.high === index && seed.along === 0 && seed.weight === 1;
  }));
  const conformed = conformHumanPersonCollar({ seam, face: face.positions, body: body.positions });
  TestValidator.predicate("both sources reach the same known face corner", [a, b].every((vertex) =>
    nclose(conformed[vertex * 3], 0) && nclose(conformed[vertex * 3 + 1], 0) && nclose(conformed[vertex * 3 + 2], 0.05),
  ));
  TestValidator.predicate("native endpoints remain caller owned", nclose(body.positions[a * 3 + 1], -0.01) && nclose(body.positions[b * 3 + 1], -0.008));
};
