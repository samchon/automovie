import { createHumanPersonSourceNormals } from "@automovie/human/human/build/createHumanPersonSourceNormals";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Zero displacement still needs every fixed source cell's actual reference point.
 * A virtual endpoint has the same ancestral chart as original zero but a distinct
 * canonical identity. Chart coverage cannot supply the original's performed
 * coordinate when only that virtual endpoint is present.
 * Scenarios:
 * 1. An admitted chart with a missing fixed normal-cell corner refuses even at q0.
 * 2. The adjacent source with the actual original corner admits and recovers.
 */
export const test_human_person_normal_transport_reference_cells = (): void => {
  const common = { generation: "analytic-reference-cell-point", originalVertices: 5,
    parentTriangles: [0, 1, 2, 0, 3, 4], intersections: [],
    refinements: [{ parent: 0, coordinates: [0, 0] as const }],
  };
  const face = { positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2],
    sourcePartition: { ...common, samples: [5, 1, 2], parents: [0], normalTransport: {
      subdivisions: [], cells: [0], bindings: [{ parent: 0 }, { parent: 0 }, { parent: 0 }],
    } },
  };
  const body = { positions: [0, 0, 0, -1, 0, 0, 0, 0, 1], indices: [0, 1, 2],
    sourcePartition: { ...common, samples: [5, 3, 4], parents: [1], normalTransport: {
      subdivisions: [], cells: [0], bindings: [{ parent: 1 }, { parent: 1 }, { parent: 1 }],
    } },
  };
  const input = { face: face.positions, body: body.positions, bodyIndices: body.indices };
  const reference = { ...input, generation: common.generation };
  const evaluate = createHumanPersonSourceNormals({ face, body })!;
  TestValidator.predicate("q0 cannot invent an unobserved fixed source point", throwsError(() => evaluate({ ...input, reference }), "fixed source cell point"));
  const supported = createHumanPersonSourceNormals({
    face: { ...face, sourcePartition: { ...face.sourcePartition, samples: [0, 1, 2] } },
    body: { ...body, sourcePartition: { ...body.sourcePartition, samples: [0, 3, 4] } },
  })!;
  TestValidator.equals("actual reference corner admits and recovers", supported({ ...input, reference }).length, 18);
};
