import { createHumanPersonSourceNormals } from "@automovie/human/human/build/createHumanPersonSourceNormals";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * A transport binding selects its ancestral star when normalParents is absent.
 * Two opposed sheets share physical samples but own distinct ancestral domains.
 * Their normals are +Z and -Z; explicit parent-zero bindings select +Z without
 * requiring a redundant optional selector. Geometry remains unchanged.
 * Scenarios:
 * 1. The legacy unselected sheets refuse ambiguous incidence, while admitted
 *    transport bindings supply the exact +Z reference field.
 * 2. A rigid quarter turn transports the selected star to +X; a conflicting
 *    separately supplied ancestral selector refuses and valid input recovers.
 * 3. A cancelled unselected ancestral domain never supplies a used density;
 *    all its physical cells still undergo reference/current geometry admission.
 */
export const test_human_person_normal_transport_selection = (): void => {
  const common = {
    generation: "analytic-opposed-normal-selection", originalVertices: 3,
    parentTriangles: [0, 1, 2, 0, 2, 1], intersections: [],
    parentNormalDomains: [1, 1, 1, 2, 2, 2],
  };
  const face = { positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2, 0, 2, 1],
    sourcePartition: { ...common, samples: [0, 1, 2], parents: [0, 1] },
  };
  const body = { positions: [], indices: [], sourcePartition: { ...common, samples: [], parents: [] } };
  TestValidator.predicate("legacy incidence needs an actual selector", throwsError(() => createHumanPersonSourceNormals({ face, body }), "ambiguous"));
  const transported = {
    face: { ...face, sourcePartition: { ...face.sourcePartition, normalTransport: {
      subdivisions: [], cells: [0, 0], bindings: [{ parent: 0 }, { parent: 0 }, { parent: 0 }],
    } } },
    body: { ...body, sourcePartition: { ...body.sourcePartition, normalTransport: { subdivisions: [], cells: [], bindings: [] } } },
  };
  const evaluate = createHumanPersonSourceNormals(transported)!;
  const input = { face: face.positions, body: [], bodyIndices: [] };
  const reference = { ...input, generation: common.generation };
  TestValidator.equals("binding supplies exact ancestral direction", evaluate({ ...input, reference }), [0, 0, 1, 0, 0, 1, 0, 0, 1]);
  const rotated = [0, 0, 0, 0, 0, -1, 0, 1, 0];
  const normal = evaluate({ ...input, face: rotated, reference });
  TestValidator.predicate("selected field is covariant", normal.every((value, at) => nclose(value, at % 3 === 0 ? 1 : 0, 1e-12)));
  TestValidator.predicate("coexisting selector cannot change binding authority", throwsError(() => createHumanPersonSourceNormals({
    ...transported, face: { ...transported.face, sourcePartition: { ...transported.face.sourcePartition, normalParents: [1, 1, 1] } },
  }), "ancestral parent selector"));
  TestValidator.equals("valid reference recovers", evaluate({ ...input, reference }), [0, 0, 1, 0, 0, 1, 0, 0, 1]);
  const unusedCommon = { ...common, generation: "analytic-unselected-cancelled-domain",
    parentTriangles: [0, 1, 2, 0, 1, 2, 0, 2, 1], parentNormalDomains: [1, 1, 1, 2, 2, 2, 2, 2, 2],
  };
  const unused = createHumanPersonSourceNormals({
    face: { ...face, indices: [0, 1, 2, 0, 1, 2, 0, 2, 1], sourcePartition: {
      ...transported.face.sourcePartition, ...unusedCommon, parents: [0, 1, 2], normalTransport: {
        ...transported.face.sourcePartition.normalTransport, cells: [0, 0, 0],
      },
    } },
    body: { ...transported.body, sourcePartition: { ...transported.body.sourcePartition, ...unusedCommon } },
  })!;
  const unusedReference = { ...reference, generation: unusedCommon.generation };
  TestValidator.equals("arranged selected reference remains valid", unused({ ...input, reference: unusedReference }), [0, 0, 1, 0, 0, 1, 0, 0, 1]);
  const selectedOnly = unused({ ...input, face: rotated, reference: unusedReference });
  TestValidator.predicate("an unselected cancelled ancestral domain is never consumed", selectedOnly.every((value, at) => nclose(value, at % 3 === 0 ? 1 : 0, 1e-12)));
};
