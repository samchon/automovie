import { connectedFaceJawExcursionMillimetres } from "@automovie/playground/src/human/anatomy/connectedFaceJawExcursionMillimetres";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/** Named forward and lateral displacements are displayed in metric units. */
export const test_subject_connected_jaw_excursion_millimetres = (): void => {
  const basis = {
    articulation: {
      jaw: {
        protrusion: {
          channel: "jawForward",
          translation: [0, -0.0015, 0.0083] as [number, number, number],
        },
        laterotrusion: {
          left: {
            channel: "jawLeft",
            translation: [0.0066, -0.0008, 0.0043] as [number, number, number],
          },
          right: {
            channel: "jawRight",
            translation: [-0.0066, -0.0008, 0.0043] as [number, number, number],
          },
        },
      },
    },
  };
  TestValidator.equals(
    "forward millimetres",
    connectedFaceJawExcursionMillimetres(basis, "jawForward"),
    8.3,
  );
  TestValidator.equals(
    "left lateral millimetres",
    connectedFaceJawExcursionMillimetres(basis, "jawLeft"),
    6.6,
  );
  TestValidator.equals(
    "right lateral magnitude",
    connectedFaceJawExcursionMillimetres(basis, "jawRight"),
    6.6,
  );
  TestValidator.equals(
    "other channel retains weight display",
    connectedFaceJawExcursionMillimetres(basis, "jawOpen"),
    null,
  );
  TestValidator.equals(
    "basis without articulation retains weights",
    connectedFaceJawExcursionMillimetres({}, "jawForward"),
    null,
  );
  for (const metres of [0, -0.001, Number.NaN, Infinity]) {
    const invalid = structuredClone(basis);
    invalid.articulation.jaw.protrusion.translation[2] = metres;
    TestValidator.predicate(
      "unsupported forward distance refuses",
      throwsError(
        () => connectedFaceJawExcursionMillimetres(invalid, "jawForward"),
        "positive named distance",
      ),
    );
  }
};
