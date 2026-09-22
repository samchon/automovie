import {
  type IAutoMovieHumanBodyBasisDocument,
  parseHumanBodyBasisDocument,
  serializeHumanBodyBasisDocument,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Body documents load and save through one admission with one envelope.
 *
 * Scenarios:
 * 1. A full document (shape, identity, pose, materials) round-trips through
 *    serialize and parse unchanged, and omitted optional fields stay omitted.
 * 2. Nonfinite weights, identity rows, pose angles and material scalars refuse
 *    on both paths; the finite neighbour of each passes.
 * 3. Blank identities, an unknown field and a bone posed twice refuse; JSON
 *    that is not a document refuses.
 * 4. Text over the 16,777,216 code-unit envelope refuses to parse, and a
 *    document that would serialize past it refuses to save.
 */
export const test_human_body_basis_document = (): void => {
  const full: IAutoMovieHumanBodyBasisDocument = {
    id: "subject",
    name: "Subject",
    basis: "mpfb-connected-body/test",
    shape: { width: 0.25, tall: 1 },
    identity: { box: [4, 0, 0.01, 0] },
    pose: [{ bone: "spine", flexion: 12.5, abduction: null, twist: -3 }],
    materials: { skin: { color: { r: 0.5, g: 0.4, b: 0.3 }, roughness: 0.6 } },
  };
  TestValidator.equals(
    "round trip",
    parseHumanBodyBasisDocument(serializeHumanBodyBasisDocument(full)),
    full,
  );
  const minimal: IAutoMovieHumanBodyBasisDocument = {
    id: "s",
    name: "S",
    basis: "b",
    shape: {},
  };
  TestValidator.equals(
    "minimal round trip keeps omissions",
    parseHumanBodyBasisDocument(serializeHumanBodyBasisDocument(minimal)),
    minimal,
  );
  const cases: [string, IAutoMovieHumanBodyBasisDocument, boolean][] = [
    [
      "nonfinite weight",
      { ...minimal, shape: { width: Number.POSITIVE_INFINITY } },
      true,
    ],
    ["finite weight", { ...minimal, shape: { width: 5 } }, false],
    [
      "nonfinite identity row",
      { ...minimal, identity: { box: [0, Number.NaN, 0, 0] } },
      true,
    ],
    [
      "finite identity row",
      { ...minimal, identity: { box: [0, 1, 0, 0] } },
      false,
    ],
    [
      "nonfinite pose angle",
      {
        ...minimal,
        pose: [
          { bone: "spine", flexion: Number.NaN, abduction: null, twist: null },
        ],
      },
      true,
    ],
    [
      "finite pose angle",
      {
        ...minimal,
        pose: [{ bone: "spine", flexion: 1, abduction: null, twist: null }],
      },
      false,
    ],
    [
      "nonfinite roughness",
      { ...minimal, materials: { skin: { roughness: Number.NaN } } },
      true,
    ],
    [
      "finite roughness",
      { ...minimal, materials: { skin: { roughness: 0.2 } } },
      false,
    ],
    [
      "nonfinite colour",
      {
        ...minimal,
        materials: { skin: { color: { r: 0, g: Number.NaN, b: 0 } } },
      },
      true,
    ],
    ["blank id", { ...minimal, id: " " }, true],
    ["blank basis", { ...minimal, basis: "" }, true],
    [
      "duplicate posed bone",
      {
        ...minimal,
        pose: [
          { bone: "spine", flexion: 1, abduction: null, twist: null },
          { bone: "spine", flexion: 2, abduction: null, twist: null },
        ],
      },
      true,
    ],
    [
      "two distinct posed bones",
      {
        ...minimal,
        pose: [
          { bone: "spine", flexion: 1, abduction: null, twist: null },
          { bone: "chest", flexion: 2, abduction: null, twist: null },
        ],
      },
      false,
    ],
    [
      "unknown field",
      { ...minimal, version: 1 } as unknown as IAutoMovieHumanBodyBasisDocument,
      true,
    ],
  ];
  for (const [title, document, refused] of cases) {
    TestValidator.equals(
      "serialize " + title,
      throwsError(() => serializeHumanBodyBasisDocument(document)),
      refused,
    );
    // JSON already turns a nonfinite number into null, so the parse side is
    // exercised on the raw text a saver could never have written.
    const text = JSON.stringify(document, (_key, value: unknown) =>
      typeof value === "number" && !Number.isFinite(value)
        ? "__nonfinite__"
        : value,
    ).replaceAll('"__nonfinite__"', "1e999");
    TestValidator.equals(
      "parse " + title,
      throwsError(() => parseHumanBodyBasisDocument(text)),
      refused,
    );
  }
  TestValidator.predicate(
    "not a document",
    throwsError(() => parseHumanBodyBasisDocument("[]")),
  );
  TestValidator.predicate(
    "oversize text refuses to parse",
    throwsError(() =>
      parseHumanBodyBasisDocument(" ".repeat(16 * 1024 * 1024 + 1)),
    ),
  );
  TestValidator.predicate(
    "oversize document refuses to save",
    throwsError(() =>
      serializeHumanBodyBasisDocument({
        ...minimal,
        name: "n".repeat(16 * 1024 * 1024),
      }),
    ),
  );
};
