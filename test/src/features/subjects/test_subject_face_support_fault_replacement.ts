import { TestValidator } from "@nestia/e2e";

import { faceSupportFaultTriangles } from "../../../scripts/face-review/faceSupportFaultTriangles";
import { faceSupportFaults } from "../../../scripts/face-review/faceSupportFaults";

/** A transverse blade whose vertical edge passes through the horizontal host. */
const blade = (y: number): number[] => [
  0.25,
  y,
  -0.1,
  0.25,
  y,
  1,
  0.75,
  y,
  1,
];

/**
 * A disappeared old crossing cannot cancel a different newly created crossing.
 * The host occupies x >= 0, y >= 0, x+y <= 1 at z=0. Each blade at y=0.25
 * crosses its interior; a blade at y=2 lies entirely outside it. Translations
 * preserve triangle orientation, so every charged fault is a crossing pair.
 *
 * Scenarios:
 * 1. Move the first blade out and the second in. The aggregate crossing count
 *    stays one, but the new pair must be charged and name host/second blade.
 * 2. Retain the same crossing identities, or remove them all. Neither result
 *    creates a new fault, and the source and result arrays remain unchanged.
 */
export const test_subject_face_support_fault_replacement = (): void => {
  const host = [0, 0, 0, 1, 0, 0, 0, 1, 0];
  const source = [...host, ...blade(0.25), ...blade(2)];
  const positions = [...host, ...blade(2), ...blade(0.25)];
  const sourceCopy = [...source];
  const positionsCopy = [...positions];
  const input = {
    source,
    positions,
    indices: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    triangles: [3, 6],
  };
  TestValidator.equals(
    "replacement crossing is charged",
    faceSupportFaults(input),
    1,
  );
  TestValidator.equals(
    "the newly intersecting pair is reported",
    [...faceSupportFaultTriangles(input)].sort((a, b) => a - b),
    [0, 6],
  );
  TestValidator.equals(
    "same pair is inherited",
    faceSupportFaults({ ...input, positions: [...source] }),
    0,
  );
  TestValidator.equals(
    "removal creates no fault",
    faceSupportFaults({
      ...input,
      positions: [...host, ...blade(2), ...blade(3)],
    }),
    0,
  );
  TestValidator.equals(
    "source remains caller owned",
    JSON.stringify(source),
    JSON.stringify(sourceCopy),
  );
  TestValidator.equals(
    "result remains caller owned",
    JSON.stringify(positions),
    JSON.stringify(positionsCopy),
  );
};
