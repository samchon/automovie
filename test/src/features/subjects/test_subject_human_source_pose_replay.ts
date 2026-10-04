import {
  createHumanFaceBasisPoseEvaluator,
  humanFaceBasisWeights,
  replayHumanFaceSourceRefinements,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Source refinement samples follow actual performed native triangles, with
 * independent bounds and an evaluator consumer that mixes cranial/jaw owners.
 * Scenarios:
 * 1. Missing metadata and an empty sample plan preserve values in fresh arrays.
 * 2. A midpoint and exact corner alias read their declared native parent while
 *    preserving the native prefix and caller buffers.
 * 3. Invalid population, sparse or repeated parent corners, sparse samples,
 *    sample parent, coordinates, nonfinite or sparse performed values and a
 *    disagreeing exact-corner alias refuse beside supported inputs.
 * 4. A 90-degree jaw turns lower vertices (0,-.05,1.4) and (.5,-.3,1.4)
 *    to (0,-1.4,1.05) and (.5,-1.4,.8). The posed triangle sample is
 *    (.125,-.675,1.1625), while independently skinning its average rest point
 *    with average jaw weight .5 gives (.125,-.73125,1.21875), a different point.
 */
export const test_subject_human_source_pose_replay = (): void => {
  type Plan = NonNullable<
    Parameters<typeof replayHumanFaceSourceRefinements>[0]
  >;
  const native = [0, 0, 0, 2, 0, 0, 0, 2, 0];
  const plan: Plan = {
    generation: "analytic-source-pose",
    nativeVertices: 3,
    nativeTriangles: [0, 1, 2],
    samples: [{ parent: 0, coordinates: [0.5, 0] }],
  };
  const positions = [...native, 7, 8, 9];
  const before = positions.slice();
  const absent = replayHumanFaceSourceRefinements(undefined, native);
  TestValidator.equals("absent plan preserves values", absent, native);
  TestValidator.predicate("absent plan owns output", absent !== native);
  TestValidator.equals(
    "empty plan preserves prefix",
    replayHumanFaceSourceRefinements({ ...plan, samples: [] }, native),
    native,
  );
  TestValidator.equals(
    "performed midpoint",
    replayHumanFaceSourceRefinements(plan, positions),
    [...native, 1, 0, 0],
  );
  TestValidator.equals("caller positions unchanged", positions, before);
  const aliases: Plan = {
    ...plan,
    samples: [
      { parent: 0, coordinates: [0, 0] },
      { parent: 0, coordinates: [1, 0] },
      { parent: 0, coordinates: [0, 1] },
      { parent: 0, coordinates: [0.25, 0.25] },
    ],
  };
  TestValidator.equals(
    "all exact corner aliases and interior sample",
    replayHumanFaceSourceRefinements(aliases, [...native, ...native, 9, 9, 9]),
    [...native, ...native, 0.5, 0.5, 0],
  );
  const sparseParents = new Array<number>(6);
  sparseParents[0] = 0;
  sparseParents[1] = 1;
  sparseParents[2] = 2;
  const sparsePositions = new Array<number>(positions.length);
  for (let index = 0; index < positions.length; index++)
    if (index !== 3) sparsePositions[index] = positions[index];
  const refused: [Plan, number[], string][] = [
    [{ ...plan, generation: " " }, positions, "compiler generation"],
    [{ ...plan, nativeVertices: 2 }, positions, "matching native"],
    [{ ...plan, nativeVertices: 3.5 }, positions, "matching native"],
    [plan, native, "matching native"],
    [{ ...plan, nativeTriangles: [] }, positions, "native prefix"],
    [{ ...plan, nativeTriangles: [0, 1] }, positions, "native prefix"],
    [{ ...plan, nativeTriangles: [0, 1, 3] }, positions, "native prefix"],
    [{ ...plan, nativeTriangles: [0, -1, 2] }, positions, "native prefix"],
    [{ ...plan, nativeTriangles: [0, 1.5, 2] }, positions, "native prefix"],
    [{ ...plan, nativeTriangles: [0, 0, 2] }, positions, "distinct native"],
    [{ ...plan, nativeTriangles: [0, 1, 1] }, positions, "distinct native"],
    [{ ...plan, nativeTriangles: [0, 1, 0] }, positions, "distinct native"],
    [{ ...plan, nativeTriangles: sparseParents }, positions, "native prefix"],
    [
      { ...plan, samples: new Array<Plan["samples"][number]>(1) },
      positions,
      "absent native parent",
    ],
    [plan, sparsePositions, "finite corner"],
    [plan, [...native, Infinity, 8, 9], "finite corner"],
    [
      { ...plan, samples: [{ parent: -1, coordinates: [0, 0] }] },
      positions,
      "absent native parent",
    ],
    [
      { ...plan, samples: [{ parent: 0.5, coordinates: [0, 0] }] },
      positions,
      "absent native parent",
    ],
    [
      { ...plan, samples: [{ parent: 1, coordinates: [0, 0] }] },
      positions,
      "absent native parent",
    ],
    [
      { ...plan, samples: [{ parent: 0, coordinates: [-0.1, 0] }] },
      positions,
      "closed chart",
    ],
    [plan, [NaN, ...positions.slice(1)], "finite corner"],
    [
      { ...plan, samples: [{ parent: 0, coordinates: [0, 0] }] },
      positions,
      "alias disagrees",
    ],
  ];
  for (const [inputPlan, inputPositions, message] of refused) {
    const snapshot = inputPositions.slice();
    TestValidator.predicate(
      "exact source refusal: " + message,
      throwsError(
        () => replayHumanFaceSourceRefinements(inputPlan, inputPositions),
        message,
      ),
    );
    TestValidator.predicate(
      "refusal preserves input",
      Array.from({ length: inputPositions.length }, (_, i) => i).every(
        (i) =>
          Object.is(inputPositions[i], snapshot[i]) &&
          Object.prototype.hasOwnProperty.call(inputPositions, i) ===
            Object.prototype.hasOwnProperty.call(snapshot, i),
      ),
    );
  }
  const { basis } = humanFaceContactFixture();
  delete basis.contact;
  const mouth = basis.surfaces[1];
  mouth.positions.push(0.125, -0.0625, 1.4);
  mouth.attachments![0].rows.push(6, 0.5);
  mouth.indices.push(0, 3, 6, 3, 4, 6, 4, 0, 6);
  mouth.regions[0].indices = mouth.indices.slice();
  mouth.sourcePosePlan = {
    generation: "analytic-mixed-native-jaw",
    nativeVertices: 6,
    nativeTriangles: [0, 1, 2, 3, 5, 4, 0, 3, 4],
    samples: [{ parent: 2, coordinates: [0.25, 0.25] }],
  };
  const state = humanFaceBasisWeights(basis, {
    shape: {},
    expression: { open: 1 },
  });
  const evaluated = createHumanFaceBasisPoseEvaluator(basis)(
    state,
    {},
  ).positions.get("mouth")!;
  const expected = [0.125, -0.675, 1.1625];
  TestValidator.predicate(
    "evaluator reaches performed source replay",
    expected.every((value, axis) => nclose(evaluated[18 + axis], value)),
  );
  TestValidator.predicate(
    "interpolated skinning is a discriminating wrong result",
    !nclose(evaluated[19], -0.73125) && !nclose(evaluated[20], 1.21875),
  );
  mouth.sourcePartition = {
    generation: "other-generation",
    originalVertices: 6,
    parentTriangles: mouth.sourcePosePlan.nativeTriangles,
    intersections: [],
    refinements: [{ parent: 2, coordinates: [0.25, 0.25] }],
    samples: [0, 1, 2, 3, 4, 5, 6],
    parents: [0, 1, 2, 2, 2],
  };
  TestValidator.predicate(
    "mismatched source generation refuses before evaluation",
    throwsError(
      () => createHumanFaceBasisPoseEvaluator(basis),
      "same compiler generation",
    ),
  );
  mouth.sourcePartition = {
    ...mouth.sourcePartition,
    generation: mouth.sourcePosePlan.generation,
  };
  TestValidator.predicate(
    "matching source generation retains performed replay",
    expected.every((value, axis) =>
      nclose(
        createHumanFaceBasisPoseEvaluator(basis)(state, {}).positions.get(
          "mouth",
        )![18 + axis],
        value,
      ),
    ),
  );
};
