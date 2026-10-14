import { TestValidator } from "@nestia/e2e";

import { admitHumanBodyBasisDocument } from "../../../../packages/human/src/body/document/admitHumanBodyBasisDocument";
import { parseHumanBodyBasisDocument } from "../../../../packages/human/src/body/document/parseHumanBodyBasisDocument";
import { serializeHumanBodyBasisDocument } from "../../../../packages/human/src/body/document/serializeHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBasisDocument } from "../../../../packages/human/src/body/structures/IAutoMovieHumanBodyBasisDocument";
import { nclose } from "../internal/nclose";

/**
 * Toe coordinates survive saving only when every supplied scalar is finite.
 *
 * Scenarios:
 *
 * 1. Finite flexion and optional abduction round-trip without changing the input.
 * 2. NaN and either infinity refuse in each toe coordinate before JSON can replace them with null.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual admission, serialization and parsing, asserting borrowed admission identity, finite round-trip values and refusal of each nonfinite coordinate. Omitting a toe scalar from finite admission fails.
 * @evidence contracts/testing.md#independent-expectations The document contract requires finite saved numbers; literal degree values and NaN/positive/negative infinity distinguish representable JSON numbers from lossy null conversion, independently of the admission implementation.
 * @evidence contracts/testing.md#distinguishing-cases Finite negative flexion, zero abduction and omitted abduction remain legal at this schema boundary; both coordinates reject all three nonfinite classes. Clinical ranges and basis-specific toe existence belong to the compiled builder.
 * @evidence contracts/testing.md#execution-ownership The named portable synchronous unit directly owns all cases through the real document boundary, without loading a basis, filesystem, worker, process or renderer.
 */
export function test_human_body_document_toe_finiteness(): void {
  const document: IAutoMovieHumanBodyBasisDocument = {
    id: "toe-document",
    name: "Toe document",
    basis: "toe-basis",
    shape: {},
    toes: [{ bone: "leftHalluxProximal", flexion: -5, abduction: 0 }],
  };
  TestValidator.predicate(
    "admission preserves input identity",
    admitHumanBodyBasisDocument(document) === document,
  );
  const restored: IAutoMovieHumanBodyBasisDocument =
    parseHumanBodyBasisDocument(serializeHumanBodyBasisDocument(document));
  TestValidator.predicate(
    "finite toe coordinates round-trip",
    restored.toes?.length === 1 &&
      restored.toes[0].bone === "leftHalluxProximal" &&
      nclose(restored.toes[0].flexion, -5, 0) &&
      nclose(restored.toes[0].abduction!, 0, 0),
  );
  const omitted: IAutoMovieHumanBodyBasisDocument = {
    ...document,
    toes: [{ bone: "leftHalluxProximal", flexion: 0 }],
  };
  const restoredOmission: IAutoMovieHumanBodyBasisDocument =
    parseHumanBodyBasisDocument(serializeHumanBodyBasisDocument(omitted));
  TestValidator.predicate(
    "omitted abduction round-trips",
    restoredOmission.toes?.length === 1 &&
      nclose(restoredOmission.toes[0].flexion, 0, 0) &&
      restoredOmission.toes[0].abduction === undefined,
  );
  for (const coordinate of ["flexion", "abduction"] as const)
    for (const value of [NaN, Infinity, -Infinity]) {
      const invalid: IAutoMovieHumanBodyBasisDocument = {
        ...document,
        toes: [{ bone: "leftHalluxProximal", flexion: 0, [coordinate]: value }],
      };
      TestValidator.error("nonfinite toe " + coordinate, (): void => {
        serializeHumanBodyBasisDocument(invalid);
      });
      TestValidator.predicate(
        "refusal preserves supplied scalar",
        Object.is(invalid.toes![0][coordinate], value),
      );
    }
}
