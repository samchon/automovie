import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyPelvisFixture } from "../internal/humanBodyPelvisFixture";
import { throwsError } from "../internal/predicates";

/**
 * A pelvifemoral rhythm is admitted only when its chain turns about the hip
 * centres and its curve can be evaluated without a refused lumbar angle.
 *
 * Scenarios, each one property away from the admitted fixture (lumbar
 * `spine` with flexion range [-30, 90], curve `[[0, 0], [100, 20]]`):
 * 1. The fixture admits, and so does a curve ending exactly at the lumbar
 *    range (`[[0, 0], [100, 90]]`).
 * 2. Refused: a blank id; a lumbar joint that is not a child of the root
 *    (a new `chest` above the spine); a leg missing or hanging from the
 *    spine; a lumbar joint with its flexion held; a coupling that drives the
 *    lumbar joint's flexion; a single knot; a first knot below the legs'
 *    rest flexion; a nonzero first ordinate; a knot that does not increase
 *    in flexion; an ordinate that falls; a non-finite knot; an ordinate past
 *    the lumbar range (`[[0, 0], [100, 91]]`).
 * 3. A coupling into the lumbar joint's abduction is not a second driver of
 *    the rhythm's axis and admits.
 */
export const test_human_body_pelvifemoral_admission = (): void => {
  const admits = (
    patch: (basis: IAutoMovieHumanBodyBasis) => void,
  ): boolean => {
    const { basis } = humanBodyPelvisFixture();
    patch(basis);
    return !throwsError(() => createHumanBodyBasisBuilder(basis));
  };
  TestValidator.predicate(
    "the fixture admits",
    admits(() => undefined),
  );
  TestValidator.predicate(
    "a tilt ending at the lumbar range admits",
    admits((basis) => {
      basis.pelvifemoral!.curve = [
        [0, 0],
        [100, 90],
      ];
    }),
  );
  const refused: [string, (basis: IAutoMovieHumanBodyBasis) => void][] = [
    [
      "blank id",
      (basis) => {
        basis.pelvifemoral!.id = " ";
      },
    ],
    [
      "lumbar joint above the root's child",
      (basis) => {
        basis.landmarks.ids.push("neck");
        basis.landmarks.positions.push(0, 3, 0);
        basis.joints.push({
          ...structuredClone(basis.joints[1]),
          bone: "chest",
          parent: "spine",
          head: "joint-spine-2",
          tail: "neck",
        });
        basis.pelvifemoral!.lumbar = "chest";
      },
    ],
    [
      "missing leg",
      (basis) => {
        basis.joints = basis.joints.filter(
          (joint) => joint.bone !== "rightUpperLeg",
        );
      },
    ],
    [
      "leg hanging from the spine",
      (basis) => {
        basis.joints.find((joint) => joint.bone === "leftUpperLeg")!.parent =
          "spine";
      },
    ],
    [
      "lumbar flexion held",
      (basis) => {
        basis.joints[1].constraint!.flexion = null;
      },
    ],
    [
      "a coupling drives the lumbar flexion",
      (basis) => {
        basis.couplings = [
          {
            id: "second",
            source: { bone: "leftUpperLeg", measure: "elevation" },
            output: { bone: "spine", axis: "flexion" },
            curve: [
              [0, 0],
              [90, 5],
            ],
          },
        ];
      },
    ],
    [
      "single knot",
      (basis) => {
        basis.pelvifemoral!.curve = [[0, 0]];
      },
    ],
    [
      "first knot below the rest",
      (basis) => {
        basis.pelvifemoral!.curve[0][0] = -1;
      },
    ],
    [
      "nonzero first ordinate",
      (basis) => {
        basis.pelvifemoral!.curve[0][1] = 1;
      },
    ],
    [
      "knot not increasing",
      (basis) => {
        basis.pelvifemoral!.curve[1][0] = 0;
      },
    ],
    [
      "falling ordinate",
      (basis) => {
        basis.pelvifemoral!.curve.push([110, 10]);
      },
    ],
    [
      "non-finite knot",
      (basis) => {
        basis.pelvifemoral!.curve[1][1] = Number.NaN;
      },
    ],
    [
      "ordinate past the lumbar range",
      (basis) => {
        basis.pelvifemoral!.curve[1][1] = 91;
      },
    ],
  ];
  for (const [title, patch] of refused) {
    const { basis } = humanBodyPelvisFixture();
    patch(basis);
    TestValidator.predicate(
      title,
      throwsError(
        () => createHumanBodyBasisBuilder(basis),
        "pelvifemoral rhythm",
      ),
    );
  }
  TestValidator.predicate(
    "a coupling into the lumbar abduction is not a second driver",
    admits((basis) => {
      basis.couplings = [
        {
          id: "lean",
          source: { bone: "leftUpperLeg", measure: "elevation" },
          output: { bone: "spine", axis: "abduction" },
          curve: [
            [0, 0],
            [90, 5],
          ],
        },
      ];
    }),
  );
};
