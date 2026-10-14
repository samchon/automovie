import { validateBuiltEnvironment } from "@automovie/engine";
import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtOpeningTestPartition } from "../internal/builtOpeningTestPartition";

/**
 * Named operations on one hierarchy must remain representable together.
 *
 * Scenarios:
 * 1. Two individually admissible states jointly produce shear and are refused.
 * 2. Removing either alternative leaves an admissible single operation.
 * 3. Moving the work far from the origin cannot hide the same basis defect.
 * 4. A non-finite world composition from finite local scales is refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs validateBuiltEnvironment with two operations on parent and child elements and asserts a combined-state refusal naming the child. Positive controls remove each alternative separately, catching both missed interactions and rejection of all movable hierarchies.
 * @evidence contracts/testing.md#independent-expectations In XY, the parent is diag(2,1)*R90 and the child diag(0.5,1)*R45. Either rotation alone leaves orthogonal world basis columns, while both yield a nonzero column dot product; translation has no role in that calculation. Finite local scales whose product exceeds Number.MAX_VALUE cannot produce finite world TRS.
 * @evidence contracts/testing.md#distinguishing-cases Covers coupled alternatives, each single-alternative neighbor, the same coupled defect at a distant world origin, and multiplication overflow. Existing test_architecture_built_opening owns panel fit, missing state values and individual opening travel limits.
 * @evidence contracts/testing.md#execution-ownership The exported test_architecture_combined_operating_shear entry is a portable validator unit using the shared authored partition fixture; all four cases execute synchronously without starting a renderer, process or dynamic test registry.
 */
export function test_architecture_combined_operating_shear(): void {
  const source: IAutoMovieBuiltEnvironment = builtOpeningTestPartition();
  const parent: IAutoMovieBuiltElement = source.elements.find(
    (element: IAutoMovieBuiltElement): boolean => element.id === "door-leaf",
  )!;
  const child: IAutoMovieBuiltElement = source.elements.find(
    (element: IAutoMovieBuiltElement): boolean => element.id === "door-fold",
  )!;
  parent.transform.scale.x = 2;
  child.transform.scale.x = 0.5;
  source.openings = [
    operatingOpening("parent-opening", parent.id, Math.PI / 2),
    operatingOpening("child-opening", child.id, Math.PI / 4),
  ];
  const combined: IAutoMovieValidation = validateBuiltEnvironment({
    environment: source,
  });
  TestValidator.predicate(
    "interacting alternatives refuse at the state collection",
    combined.success === false &&
      combined.violations.some(
        (violation: IAutoMovieConstraintViolation): boolean =>
          violation.path === "$input.openings[1].operation.states" &&
          violation.expected.includes("combined operating states") &&
          violation.expected.includes('element "door-fold"'),
      ),
  );
  for (const index of [0, 1]) {
    const single: IAutoMovieBuiltEnvironment = structuredClone(source);
    single.openings[index]!.operation!.states = [
      single.openings[index]!.operation!.states[0]!,
    ];
    TestValidator.equals(
      "either alternative alone remains representable",
      validateBuiltEnvironment({ environment: single }).success,
      true,
    );
  }
  const distant: IAutoMovieBuiltEnvironment = structuredClone(source);
  distant.elements[0]!.transform.translation.x = 1e12;
  distant.openings[0]!.operation!.state = "active";
  distant.openings[1]!.operation!.state = "active";
  const distantResult: IAutoMovieValidation = validateBuiltEnvironment({
    environment: distant,
  });
  TestValidator.predicate(
    "translation cannot dilute basis shear",
    distantResult.success === false &&
      distantResult.violations.some(
        (violation: IAutoMovieConstraintViolation): boolean =>
          violation.path.endsWith(".transform") &&
          violation.expected.includes("contains shear"),
      ),
  );
  const overflow: IAutoMovieBuiltEnvironment = builtOpeningTestPartition();
  overflow.openings = [];
  overflow.elements[0]!.transform.scale.x = 1e200;
  overflow.elements[1]!.transform.scale.x = 1e200;
  const overflowResult: IAutoMovieValidation = validateBuiltEnvironment({
    environment: overflow,
  });
  TestValidator.predicate(
    "finite inputs cannot admit a non-finite composed matrix",
    overflowResult.success === false &&
      overflowResult.violations.some(
        (violation: IAutoMovieConstraintViolation): boolean =>
          violation.path === "$input.elements[1].transform" &&
          violation.expected.includes("contains shear"),
      ),
  );
}

/** One explicit revolute panel with idle and active named states. */
function operatingOpening(
  id: string,
  element: string,
  angle: number,
): IAutoMovieBuiltOpening {
  return {
    id,
    kind: "door",
    boundary: "partition",
    fill: element,
    operation: {
      panels: [
        {
          id: "leaf",
          element,
          width: 1,
          height: 1,
          motion: {
            kind: "revolute",
            axis: { x: 0, y: 0, z: 1 },
            pivot: { x: 0, y: 0, z: 0 },
            min: 0,
            max: angle,
          },
        },
      ],
      states: [
        { id: "idle", panels: [{ panel: "leaf", value: 0 }] },
        { id: "active", panels: [{ panel: "leaf", value: angle }] },
      ],
      state: "idle",
      hardware: [],
    },
  };
}
