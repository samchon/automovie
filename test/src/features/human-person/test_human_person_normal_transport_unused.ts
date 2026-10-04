import { createHumanPersonSourceNormals } from "@automovie/human/human/build/createHumanPersonSourceNormals";
import { TestValidator } from "@nestia/e2e";

/**
 * An unused coordinate cannot activate refinement incidence in an unchanged skin.
 * Two perpendicular planes provide a tilted ancestral corner field. A renderer
 * sample inside a fixed feature cell distinguishes interpolation of already
 * normalized fine normals from the original raw chart. Only used physical
 * coordinates define zero displacement; unused vertices still emit zero normals.
 * Scenarios:
 * 1. Changing only an unused vertex preserves the exact reference normal array.
 * 2. A disconnected raw parent changes its own field while the unaffected
 *    feature family retains its exact ancestral chart.
 * 3. Returning the unused vertex and repeating the call preserve exact recovery.
 */
export const test_human_person_normal_transport_unused = (): void => {
  const common = {
    generation: "analytic-unused-refinement", originalVertices: 5,
    parentTriangles: [0, 1, 2, 0, 3, 4], intersections: [],
    refinements: [{ parent: 0, coordinates: [0.25, 0.25] as const }, { parent: 0, coordinates: [0.25, 0.125] as const }],
  };
  const subdivisions = [{ parent: 0, triangles: [0, 1, 5, 1, 2, 5, 2, 0, 5], domains: [0, 0, 0, 0, 0, 0, 0, 0, 0] }];
  const face = {
    positions: [0, 0, 0, 2, 0, 0, 0, 2, 0, 0.5, 0.5, 0, 0.5, 0.25, 0, 9, 9, 9],
    indices: [0, 1, 4, 1, 3, 4, 3, 0, 4, 1, 2, 3, 2, 0, 3],
    sourcePartition: { ...common, samples: [0, 1, 2, 5, 6, 0], parents: [0, 0, 0, 0, 0], normalTransport: {
      subdivisions, cells: [0, 0, 0, 1, 2], bindings: [
        { parent: 0, cell: 0, coordinates: [0, 0] as const },
        { parent: 0, cell: 0, coordinates: [1, 0] as const },
        { parent: 0, cell: 1, coordinates: [1, 0] as const },
        { parent: 0, cell: 0, coordinates: [0, 1] as const },
        { parent: 0, cell: 0, coordinates: [0.125, 0.5] as const }, null,
      ],
    } },
  };
  const body = {
    positions: [0, 0, 0, -2, 0, 0, 0, 0, 2], indices: [0, 1, 2],
    sourcePartition: { ...common, samples: [0, 3, 4], parents: [1], normalTransport: {
      subdivisions, cells: [0], bindings: [{ parent: 1 }, { parent: 1 }, { parent: 1 }],
    } },
  };
  const evaluate = createHumanPersonSourceNormals({ face, body })!;
  const input = { face: face.positions, body: body.positions, bodyIndices: body.indices };
  const reference = { ...input, generation: common.generation };
  const zero = evaluate({ ...input, reference });
  const changed = [...input.face];
  changed[15] = 19;
  const unusedResult = evaluate({ ...input, face: changed, reference });
  const farCommon = { ...common, originalVertices: 8, parentTriangles: [...common.parentTriangles, 5, 6, 7] };
  const farSubdivisions = subdivisions.map((one) => ({ ...one, triangles: one.triangles.map((sample) => sample === 5 ? 8 : sample) }));
  const farFace = { ...face, sourcePartition: { ...face.sourcePartition, ...farCommon,
    samples: face.sourcePartition.samples.map((sample) => sample === 5 ? 8 : sample === 6 ? 9 : sample),
    normalTransport: { ...face.sourcePartition.normalTransport, subdivisions: farSubdivisions },
  } };
  const farBody = { positions: [...body.positions, 10, 0, 0, 12, 0, 0, 10, 2, 0], indices: [...body.indices, 3, 4, 5],
    sourcePartition: { ...farCommon, samples: [0, 3, 4, 5, 6, 7], parents: [1, 2], normalTransport: {
      subdivisions: farSubdivisions, cells: [0, 0], bindings: [1, 1, 1, 2, 2, 2].map((parent) => ({ parent })),
    } },
  };
  const farInput = { face: farFace.positions, body: farBody.positions, bodyIndices: farBody.indices };
  const farReference = { ...farInput, generation: common.generation };
  const farEvaluate = createHumanPersonSourceNormals({ face: farFace, body: farBody })!;
  const farZero = farEvaluate({ ...farInput, reference: farReference });
  const farChanged = [...farInput.body];
  farChanged[17] = 1;
  const farResult = farEvaluate({ ...farInput, body: farChanged, reference: farReference });
  TestValidator.predicate("arranged far parent really deforms its field", farResult.slice(18).some((value, at) => value !== farZero[18 + at]));
  TestValidator.equals("unused and disconnected motion retain the exact unaffected ancestral field",
    [unusedResult, farResult.slice(0, 18)], [zero, farZero.slice(0, 18)]);
  TestValidator.equals("unused motion returns exactly", evaluate({ ...input, reference }), zero);
  const prefixed = { ...face,
    positions: [9, 9, 9, ...face.positions.slice(0, 15)],
    indices: face.indices.map((vertex) => vertex + 1),
    sourcePartition: { ...face.sourcePartition, samples: [6, ...face.sourcePartition.samples.slice(0, 5)], normalTransport: {
      ...face.sourcePartition.normalTransport, bindings: [null, ...face.sourcePartition.normalTransport.bindings.slice(0, 5)],
    } },
  };
  const prefixedInput = { ...input, face: prefixed.positions };
  const prefixedNormals = createHumanPersonSourceNormals({ face: prefixed, body })!({
    ...prefixedInput, reference: { ...prefixedInput, generation: common.generation },
  });
  TestValidator.equals("an unused alias cannot shadow an actual normal-cell binding",
    prefixedNormals, [0, 0, 0, ...zero.slice(0, 15), ...zero.slice(18)]);
};
