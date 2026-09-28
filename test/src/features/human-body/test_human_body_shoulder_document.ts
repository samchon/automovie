import {
  type IAutoMovieHumanBodyBasisDocument,
  createHumanBodyBasisBuilder,
  parseHumanBodyBasisDocument,
  serializeHumanBodyBasisDocument,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { throwsError } from "../internal/predicates";

/**
 * Saved TT fields are explicit, exact and never a silent reinterpretation of
 * an old upper-arm Euler pose or an old basis revision.
 */
export const test_human_body_shoulder_document = (): void => {
  const { basis, document } = humanBodyShoulderFixture();
  const left = {
    bone: "leftUpperArm" as const,
    plane: 90,
    elevation: 120,
    axialRotation: 15,
  };
  const full = { ...document, shoulders: [left] };
  TestValidator.equals(
    "shoulder goal round trips without a generic pose entry",
    parseHumanBodyBasisDocument(serializeHumanBodyBasisDocument(full)),
    full,
  );
  const cases: [string, IAutoMovieHumanBodyBasisDocument, boolean][] = [
    [
      "negative canonical plane",
      { ...document, shoulders: [{ ...left, plane: -180 }] },
      false,
    ],
    [
      "positive plane endpoint",
      { ...document, shoulders: [{ ...left, plane: 180 }] },
      true,
    ],
    [
      "plane below period",
      { ...document, shoulders: [{ ...left, plane: -180.01 }] },
      true,
    ],
    [
      "nonfinite plane",
      { ...document, shoulders: [{ ...left, plane: Number.NaN }] },
      true,
    ],
    [
      "nonfinite elevation",
      { ...document, shoulders: [{ ...left, elevation: Infinity }] },
      true,
    ],
    [
      "nonfinite axial",
      { ...document, shoulders: [{ ...left, axialRotation: -Infinity }] },
      true,
    ],
    [
      "duplicate shoulder",
      { ...document, shoulders: [left, { ...left }] },
      true,
    ],
    [
      "old generic upper-arm entry",
      {
        ...document,
        pose: [{ bone: "leftUpperArm", flexion: 90, abduction: 0, twist: 0 }],
      },
      true,
    ],
  ];
  for (const [title, candidate, refused] of cases)
    TestValidator.equals(
      title,
      throwsError(() => serializeHumanBodyBasisDocument(candidate)),
      refused,
    );
  const build = createHumanBodyBasisBuilder(basis);
  for (const [title, shoulder, refused] of [
    ["elevation at zero", { ...left, elevation: 0 }, false],
    ["elevation at 180", { ...left, elevation: 180 }, false],
    ["elevation below zero", { ...left, elevation: -0.01 }, true],
    ["elevation above 180", { ...left, elevation: 180.01 }, true],
    ["axial at -90", { ...left, axialRotation: -90 }, false],
    ["axial at +90", { ...left, axialRotation: 90 }, false],
    ["axial below -90", { ...left, axialRotation: -90.01 }, true],
    ["axial above +90", { ...left, axialRotation: 90.01 }, true],
  ] as const)
    TestValidator.equals(
      title,
      throwsError(() => build({ ...document, shoulders: [shoulder] })),
      refused,
    );
  const legacy = structuredClone(basis);
  delete legacy.joints.find((joint) => joint.bone === "leftUpperArm")!.shoulder;
  TestValidator.predicate(
    "old fixed-axis basis refuses at compile boundary",
    throwsError(
      () => createHumanBodyBasisBuilder(legacy),
      "old fixed-axis bases cannot be reinterpreted",
    ),
  );
};
