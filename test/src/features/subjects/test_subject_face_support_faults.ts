import { TestValidator } from "@nestia/e2e";

import {
  faceSupportFaultTriangles,
  faceSupportFaults,
} from "../../../scripts/face-review/faceEnvelope";

/** A horizontal host and a separate vertical blade, in metres. */
const host = [0, 0, 0, 1, 0, 0, 0, 1, 0];
const blade = (y: number, lowZ: number): number[] => [
  0.25,
  y,
  lowZ,
  0.25,
  y,
  1,
  0.75,
  y,
  1,
];
const indices = [0, 1, 2, 3, 4, 5];
const source = [...host, ...blade(0.25, 1)];
const position = (y: number, lowZ: number) => [...host, ...blade(y, lowZ)];
const faults = (posed: number[], exempt = new Set<number>(), triangles = [3]) =>
  faceSupportFaults({
    source,
    positions: posed,
    indices,
    triangles,
    contact: exempt,
  });

/**
 * The face's moved support charges new transverse crossings once, excludes
 * intended two-lip contact, and treats an arithmetic edge touch as contact.
 * The baseline and moving triangle sets are explicit inputs, not inferred
 * from the assertion being made.
 */
export const test_subject_face_support_faults = (): void => {
  const crossed = position(0.25, -1e-6);
  TestValidator.equals("new crossing is one fault", faults(crossed), 1);
  TestValidator.equals(
    "both crossed triangles are named",
    [
      ...faceSupportFaultTriangles({
        source,
        positions: crossed,
        indices,
        triangles: [3],
      }),
    ].sort((a, b) => a - b),
    [0, 3],
  );
  TestValidator.equals(
    "the two contact triangles may meet",
    faults(crossed, new Set([0, 3])),
    0,
  );
  TestValidator.equals(
    "a triangle outside the selected support is not charged",
    faults(crossed, new Set(), []),
    0,
  );
  TestValidator.equals(
    "roundoff at the segment endpoint is contact",
    faults(position(0.25, -1e-13)),
    0,
  );
  TestValidator.equals(
    "roundoff at the triangle edge is contact",
    faults(position(1e-13, -1)),
    0,
  );
  TestValidator.equals(
    "a micrometre inside the edge is a crossing",
    faults(position(1e-6, -1)),
    1,
  );
  const alreadyCrossed = position(0.25, -0.1);
  TestValidator.equals(
    "a crossing already in the source adds no fault",
    faceSupportFaults({
      source: alreadyCrossed,
      positions: position(0.25, -0.2),
      indices,
      triangles: [3],
    }),
    0,
  );
  TestValidator.equals(
    "removing an old crossing does not produce a negative fault",
    faceSupportFaults({
      source: alreadyCrossed,
      positions: source,
      indices,
      triangles: [3],
    }),
    0,
  );
};
